# apache-auth
#### Frontend for a transparent cookie-based authentication layer for artbirary Apache vhosts

## Overview

`apache-auth` is a simple Express/React application that serves as a frontend for accepting and destroying client-side session authentication cookies distributed and validated server-side using Apache's `mod_auth_form` module. Together with `mod_auth_form`, `apache-auth` behaves as a full framework for an elegant, *fully transparent and stack-agnostic* SSO implementation for any web application.

This project attempts to be a simple solution to auth-walling any virtual host: unlike more complex SSO implementations that require explicit integration with your application logic for authentication, `apache-auth` sits *transparently* between the client and underlying application in the virtual host configuration.

The goal of this project is to provide a *simple and straightforward* implementation of SSO to auth-wall arbitrary applications against an existing `.htpasswd` user directory.

![Screencap](http://i.imgur.com/AVizIr5.gif)

## Architecture

I use a dedicated domain `auth.kevinlin.info` for SSO authentication requests. Requests to any domain on `*.kevinlin.info` secured under `apache-auth` are validated server-side for a session cookie. If the cookie is valid and present, the request continues uninterrupted; if not, the user is 302 redirected to `auth.kevinlin.info` where he or she will receive a `Set-Cookie` header from `mod_auth_form`, storing a client-side session cookie. Further requests to auth-walled domains will continue transparently until the user destroys the cookie (via a logout) or the cookie reaches its expiry time.

![Architecture diagram](http://i.imgur.com/PUVdcDb.png)

## Sample configuration and usage

Making use of this application involves setting up the configuration for the virtual host running the authentication site (in my case, `auth.kevinlin.info`), and configuration for any virtual host that should be protected with authentication.

For example, if `apache-auth` is running locally on port `18800`:

```
<VirtualHost *:80>
    ServerName auth.kevinlin.info
    Redirect permanent / https://auth.kevinlin.info/
</VirtualHost>

<VirtualHost *:443>
    ServerName auth.kevinlin.info

    <Location "/error">
        Deny from all
        ProxyPass !
    </Location>

    <Location "/auth-login">
        SetHandler form-login-handler
        AuthFormLoginRequiredLocation "https://auth.kevinlin.info/error"
        AuthFormProvider file
        AuthUserFile "/etc/apache2/.htpasswd"
        AuthType form
        AuthName "SSO"

        Session On
        SessionCookieName session path=/;domain=.kevinlin.info;httponly;secure
        SessionCryptoPassphrase ${APACHE_SESSION_PASSPHRASE}
        SessionMaxAge 86400

        Require user kiwi

        ProxyPass !
    </Location>

    <Location "/auth-logout">
        SetHandler form-logout-handler
        AuthName "SSO"

        Session On
        SessionCookieName session path=/;domain=.kevinlin.info;httponly;secure
        SessionCryptoPassphrase ${APACHE_SESSION_PASSPHRASE}
        SessionMaxAge 86400

        ProxyPass !
    </Location>

    ProxyRequests Off
    ProxyPreserveHost On
    ProxyPass / http://127.0.0.1:18800/
    ProxyPassReverse / http://127.0.0.1:18800/

    ErrorLog ${APACHE_LOG_DIR}/kevinlin-auth-error.log
    CustomLog ${APACHE_LOG_DIR}/kevinlin-auth-access.log combined

    SSLCertificateFile /etc/letsencrypt/live/server.kevinlin.info/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/server.kevinlin.info/privkey.pem
    Include /etc/letsencrypt/options-ssl-apache.conf
</VirtualHost>
```

This is structured deliberately so that AJAX requests to the authentication endpoint `/auth-login` will return an HTTP 403 on authentication error (due to a redirect to the `/error` location which has `Deny from all`) and HTTP 200 on success. The browser properly takes care of storing the cookie returned by Apache's `Set-Cookie` header for the domain specified; in the above configuration, all requests to `.kevinlin.info` domains will have the session cookie header.

Securing a virtual host is as simple as adding a directive under a `Location` block:

```
<VirtualHost ...>
	...

	<Location "/">
        AuthFormProvider file
        AuthUserFile "/etc/apache2/.htpasswd"
        AuthType form
        AuthName "SSO"
        AuthFormLoginRequiredLocation "https://auth.kevinlin.info/login?redirect=%{REQUEST_SCHEME}://%{HTTP_HOST}%{REQUEST_URI}"

        Session On
        SessionCookieName session path=/;domain=.kevinlin.info;httponly;secure
        SessionCryptoPassphrase ${APACHE_SESSION_PASSPHRASE}
        SessionMaxAge 86400

        Require valid-user
    </Location>
</VirtualHost>
```