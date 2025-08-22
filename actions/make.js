import path, { dirname } from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import { apiDir, rootDir } from '../lib/functions.js';
import Handlebars from "handlebars";

class Make
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

    nc()
    {
        // @comment 创建一个新的 Web 组件 
        const args = process.argv.slice(2);
        const cname = args[1].trim()||false;
        console.log('create new component: ', cname);
        if (!cname) {
            console.error('Please input component name');
            process.exit(1);
        }

        // 计算模版文件路径
        const block_folder = path.join(rootDir, 'web', 'src', 'blocks');
        const template_file = path.join(block_folder, '_empty.hbs');
        const target_file = path.join(block_folder, cname + '.jsx');
        if(fs.existsSync(target_file)) {
            console.error('file exists');
            process.exit(1);
        }
        // 大驼峰命名
        const component_name = cname.split('-').map(item => item.charAt(0).toUpperCase() + item.slice(1)).join('');
        // 使用 handlebars 渲染模版
        const template = Handlebars.compile(fs.readFileSync(template_file, 'utf-8'));
        const content = template({ "COMPONENT_NAME":component_name });
        // 写入文件
        fs.writeFileSync(target_file, content);
        console.log('done');
    }


}

export default new Make();