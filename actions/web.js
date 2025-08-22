import path, { dirname } from 'path';
import { execSync } from 'child_process';
import { webDir } from '../lib/functions.js';

class Web
{
    main()
    {
        // 列出本class的所有方法，并且输出方法上的注释（通过@comment注释的内容）
        const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(this));
        methods.forEach(method => {
            if (method !== 'constructor' && method !== 'main') {
                const comment = this[method].toString().match(/@comment\s(.*)/);
                console.log(`${method}: ${comment ? comment[1] : ''}`);
            }
        });
    }

    dev()
    {
        // @comment 启动 web 服务，并监测改动
        execSync(`yarn dev --host=dd.ftqq.com`, { stdio: 'inherit' });
    }


}

export default new Web();