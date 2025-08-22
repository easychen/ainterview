import { Loader } from '@mantine/core';
import { useEffect } from 'react';
import useAppState from '@/hooks/useAppState';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function Page() {
    const store = useAppState();
    const nav = useNavigate();

    useEffect(() => {
        logout();
    },[])

    async function logout()
    {
        const ret = await store.logout();
        if( ret )
        {
            toast.success('Logout success');
            nav('/');
        }
    } 
    
    return <div className="w-screen h-screen flex flex-col items-center justify-center">
    <Loader />
    <div className="text-lg text-gray-400 mt-2">Logging out...</div>
</div>
}