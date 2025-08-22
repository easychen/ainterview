import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

const apiBaseURL = import.meta.env.VITE_API_BASE_URL

const useAppState = create(
    persist(
        (set) => ({
            name: "CubeGlobal",
            incName: () => set((state) => ({ name: state.name + "!" })),
            token: null,
            setToken: (token) => set({ token }),
            user: {},
            setUser: (user) => set({ user }),
            // 读取
            loadUser: async (token) => {
                const response = await fetch(apiBaseURL + '/profile', {
                    headers: {
                        'Authorization': 'Bearer ' + token
                    }
                });
                const user = await response.json();
                if( user && user.id )
                {
                    set({ user, token })
                }
                return user
            },
            logout: async () => {
                const response = await fetch(apiBaseURL + '/logout', {
                    headers: {
                        'Authorization': 'Bearer ' + useAppState.getState().token
                    },
                    method: 'POST'
                });
                const ret = await response.json();
                set({ user: {}, token: null })
                if( ret && !ret.error )
                {
                    return true;
                }
                return false;
            }
          })
        , {
            name: 'app-state',
            storage: createJSONStorage(()=>localStorage),
            // 部分持久化
            partialize: (state) => ({ user: state.user, token: state.token }),
        })
)

export default useAppState