import path, { dirname } from 'path';
import { execSync } from 'child_process';
import { apiDir } from '../lib/functions.js';

class Api
{
    main()
    {
        console.log('main');
    }

    dev()
    {
        execSync(`cd ${apiDir} && node ace serve --watch`, { stdio: 'inherit' });
    }


}

export default new Api();