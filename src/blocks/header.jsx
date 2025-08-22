import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate, NavLink, useLocation } from 'react-router-dom';
import LoginButton from './login-button';
import useAppState from '@/hooks/useAppState';
import UserMenu from '@/blocks/user-menu';

export default function Header({ items }) {
    
    if( !items ) items = [
        { label: 'Home', href: '/' },
        { label: 'AI 访谈', href: '/interview' },
        { label: 'Menu1', href: '/menu' },
        { label: 'Menu2', href: '/menu2/section1', prefix: '/menu2' },
        { label: 'Menu3', href: '/menu3/section1', prefix: '/menu3' },
    ];

    const location = useLocation();
    const path = location.pathname;
    const nav = useNavigate();
    const state = useAppState();
    const user = state.user;

    
    // const [isMenuOpen, setIsMenuOpen] = React.useState(false);

    return (
        <div className="header-cg">
            <div className="container-cg w-full flex flex-row items-center z-50 justify-between">
                <div className="left mr-5 ml-5 md:ml-0">
                    <div className="text-lg cursor-pointer" onClick={()=>nav("/")}>CubeGlobal</div>
                </div>
                <div className="middle md:flex flex-1 hidden ">
                    {/* 如果item.prefix存在，那么判断包含；否则，直接判断相等 */}
                    {items.map((item, index) => {
                        const isActive = item.prefix ? path.includes(item.prefix) : path === item.href;
                        return (
                            <NavLink key={index} to={item.href} className={`mx-5 h-[4rem] pt-1 flex items-center border-b-4 hover:border-gray-300 hover:text-black transition-colors duration-500 ${isActive ? 'text-blue-500 border-blue-500 ' : 'border-gray-100 text-gray-500 border-transparent  '}`}>
                            {item.label}
                            </NavLink>
                        );
                    })}

                </div>
                <div className="right md:ml-5 md:mr-0 mr-5">
                    {user.id ? <UserMenu user={user} /> : <LoginButton />}
                </div>

            </div>
        </div>
    )
}

Header.propTypes = {
    items: PropTypes.arrayOf(PropTypes.shape({
        label: PropTypes.string.isRequired,
        href: PropTypes.string.isRequired,
        prefix: PropTypes.string,
    })),
    
};
