// import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { routes } from 'generouted/react-router'
import { MantineProvider } from '@mantine/core';
import { Toaster } from 'react-hot-toast';
// import {NextUIProvider} from "@nextui-org/react";
import './index.scss'

ReactDOM.createRoot(document.getElementById('root')).render(<MantineProvider><RouterProvider router={createBrowserRouter(routes)} /><Toaster/></MantineProvider>)
