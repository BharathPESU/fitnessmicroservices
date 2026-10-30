import { configureStore } from '@reduxjs/toolkit'
import React from 'react'
import authReducer from './authSlice'
export const store = configureStore({reducer:
    {auth:authReducer,},});