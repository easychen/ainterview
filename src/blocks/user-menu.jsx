// import React from 'react';
import PropTypes from 'prop-types';
import { Avatar, Button, Menu } from '@mantine/core';
import { BiChevronDown } from 'react-icons/bi';
import { FiUser, FiLogOut } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

export default function UserMenu(props) {
    const user = props.user;
    const nav = useNavigate();
    
    return user ? <div className="flex flex-row items-center">
        <div><Avatar size="md" src={user.avatar_url} alt={user.nickname} radius={"xl"} /></div>
        <div className="mx-1">
            <Menu className="flex flex-row items-center">
            <Menu.Target>
                <Button variant="none" className="hover:text-blue-500 transition-colors duration-500" rightIcon={<BiChevronDown size={16} />} >{user.nickname}</Button>
            </Menu.Target>
            <Menu.Dropdown>
                <Menu.Item component='button' onClick={()=>nav('/profile')} icon={<FiUser/>}>
                    Profile
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item component='button' onClick={()=>nav('/logout')} icon={<FiLogOut/>}>
                    Logout
                </Menu.Item>
            </Menu.Dropdown> 
            </Menu>   
        </div>
        
    </div> : null;
}

UserMenu.propTypes = {
    user: PropTypes.object.isRequired,    
};

