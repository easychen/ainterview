// import React from 'react';
import PropTypes from 'prop-types';
import { Button, Menu } from '@mantine/core';
import { RxGithubLogo } from 'react-icons/rx';
import { BiChevronDown } from 'react-icons/bi';
import { BsWechat, BsDiscord } from 'react-icons/bs';
import toast from 'react-hot-toast';

const ButtonIcons = {
    github: <RxGithubLogo />,
    discord: <BsDiscord />,
    wechat: <BsWechat />,
}

export default function LoginButton() {
    const clients = ['github','discord','wechat'];
    const apiBaseUrl= import.meta.env.VITE_API_BASE_URL;
    
    function wait(){
        toast.loading('Redirect to OAuth page...')
    }
    return <Menu className="flex flex-row items-center">
        <Menu.Target>
            <Button variant="none" className="hover:text-blue-500 transition-colors duration-500" rightIcon={<BiChevronDown size={16} />} >Login</Button>
        </Menu.Target>
        <Menu.Dropdown>
        
        {
            clients.map( item =>{
                return <Menu.Item key={item} component="a" onClick={()=>wait()} href={`${apiBaseUrl}/${item}/redirect`} variant="Outline" className="capitalize" icon={ButtonIcons[item]} >{item}</Menu.Item>
            } )
        }
        </Menu.Dropdown>
       
    </Menu> ;
}

LoginButton.propTypes = {
    client: PropTypes.string,    
};

