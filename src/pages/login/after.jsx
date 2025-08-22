// import { useLocation } from 'react-router-dom';
import Header from '@/blocks/header';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Page() {
    const inWechat = /MicroMessenger/i.test(navigator.userAgent);
    const nav = useNavigate();
    useEffect(() => {
        const timer = inWechat? null : setTimeout(() => {
            nav('/');
        }, 1000);
        return () => {
            if(timer)
                clearTimeout(timer);
        }
    })

    return <><Header />
    <div className="body container-cg">
    <div className=" mx-auto w-2/3">{ inWechat ? 'Please return to the computer to continue.' : 'Successfully logged in, redirecting to the homepage...'}</div>
    </div></>
}