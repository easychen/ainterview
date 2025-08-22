// import { useLocation } from 'react-router-dom';
import Header from '@/blocks/header';

export default function Page() {
    return <>
    <Header />
    <div className="container-cg flex flex-row  min-h-[calc(100vh-135px)]">
        <div className="side bg-red-100 min-w-[200px]">
            side
        </div>
        <div className="main bg-blue-100 flex-1">
            main
        </div>
    </div>
    </>
}