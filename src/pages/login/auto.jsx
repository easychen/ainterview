import { useLocation } from 'react-router-dom';
import { Loader } from '@mantine/core';
import useAppState from '@/hooks/useAppState';
import { useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function Page() {
    // 从 url 中获取query参数
    const token = new URLSearchParams(useLocation().search).get('token');
    const store = useAppState();
    const nav = useNavigate();

    useEffect(() => {
        if( token )
        {
            loadUser(token);
        }
    },[token])

    async function loadUser(token)
    {
        const user = await store.loadUser(token);
        if( user && user.id )
        {
            toast.success('Login success');
            nav('/login/after');
        }else
        {
            toast.error('Login failed');
            nav('/');
        }
    }
    
    // // 使用 swr 获取数据
    // const { data, error, isLoading } = useSWR( import.meta.env.VITE_API_BASE_URL + '/profile', async url => {
    //     const ret = await fetch(url, {
    //         headers: {
    //             'Authorization': 'Bearer ' + token
    //         }
    //     });
    //     return await ret.json();
    // });

    return <div className="w-screen h-screen flex flex-col items-center justify-center">
        <Loader />
        <div className="text-lg text-gray-400 mt-2">Logging in...</div>
    </div>
}


