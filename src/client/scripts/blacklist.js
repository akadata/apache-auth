/* global document */

import Blacklist from '../../shared/components/blacklist';
import {render} from 'react-dom';

render(new Blacklist(), document.getElementById('app'));
