import { promisify } from 'util';

const delay = promisify(setTimeout);

export default delay;
