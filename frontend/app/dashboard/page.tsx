"use client"


import { useState } from "react";
import { useDescope, useSession,  useUser } from "@descope/nextjs-sdk/client";
import { useRouter } from "next/navigation";
import ChatPanel from "@/components/dashboard/chat-panel";
import ConnectionsPanel from "@/components/dashboard/connection-panel";
import { Button } from "@/components/ui/button";
import { Ghost, LogOut } from "lucide-react";
const styles = {
  loadingShell:
    "app-shell-bg flex h-svh items-center justify-center text-sm text-muted-foreground",
  shell: "app-shell-bg",
  userLabel: "mb-2 truncate px-1 text-sm text-muted-foreground",
  logoutBtn:
    "w-full justify-start gap-2 text-muted-foreground hover:text-foreground",
  logoutIcon: "size-4",
} as const;



function DashBoardPage (){
  const sdk = useDescope();
  const router = useRouter();
  const {isAuthenticated, sessionToken} = useSession();
  const {user, isUserLoading} = useUser();


  const [logginOut, setLogginOut] = useState(false);
  const label = user?.email || user?.name || "Sign in User"

  async function handleLogout() {
    if(logginOut) return 
    setLogginOut(true)

    try{
      await sdk.logout()
      router.replace('/sign-in')
      router.refresh()


    }catch{
      setLogginOut(false)
    }
    
  }
  if(!isAuthenticated || !sessionToken){
    return <div className={styles.loadingShell}>Checking session...</div>
  }
  return (
    <div className={styles.shell}>
      <ChatPanel 
      sessionToken={sessionToken}
      connections={<ConnectionsPanel sessionToken={sessionToken} />}
      footer={
        <>
        <div className={styles.userLabel}>
        {isUserLoading ? "Loading...": label}

        </div>
        <Button 
        variant='ghost'
        className={styles.logoutBtn}
        disabled={logginOut}
        onClick={()=>handleLogout()}
        >
          <LogOut className={styles.logoutIcon}/>
          {logginOut ? "Logging out..." : "Log out"}
        </Button>
        </>
      }

      />
      
    </div>
  )
}

export default DashBoardPage 







