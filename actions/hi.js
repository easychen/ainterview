import { hello, getPrompt, gen } from '../lib/functions.js';
import { execSync } from 'child_process';

class Hi
{
    main()
    {
        hello();
    }

    env()
    {
        console.log(process.env);
    }

    async poem()
    {
        const prompt =  getPrompt('tang_poem');
        const poem = await gen(prompt);
        console.log(poem);

        // 将返回值复制到剪贴板
        execSync(`echo "${poem.json?.poem||""}" | pbcopy`);

    }
}

export default new Hi();