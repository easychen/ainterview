import { hello, getPrompt, gen } from '../lib/functions.js';
import pkg from 'enquirer';
const { prompt } = pkg;

class Product
{
    main()
    {
        hello();
    }
}

export default new Product();