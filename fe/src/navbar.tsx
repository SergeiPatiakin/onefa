// Code related to the navbar component
import { AppBar, Box, Button, Menu, MenuItem, Toolbar } from "@mui/material"
import { useNavigate } from "react-router"
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import { useState } from "react"
import { login, logout } from "./api-client"

interface NavBarProps {
  currentPage: 'codes' | 'keys' | 'not-found' | 'unauthenticated'
}

export const NavBar = (props: NavBarProps) => {
  const navigate = useNavigate()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }
  const handleClose = () => {
    setAnchorEl(null)
  }
  return <AppBar position='sticky'>
    <Toolbar>
      <div style={{ cursor: 'pointer', paddingRight: '8px' }} onClick={() => {
        navigate('/')
      }}>
        <p style={{
          fontFamily: 'monospace',
          fontSize: '20px',
          margin: '0px',
          fontWeight: 'bold'
        }}>1FA</p>
      </div>
      <Button
        color="inherit"
        disabled={props.currentPage == 'codes' || props.currentPage == 'unauthenticated'}
        onClick={() => {
          navigate('/')
        }}
      >
        Codes
      </Button>
      <Button
        color="inherit"
        disabled={props.currentPage == 'keys' || props.currentPage == 'unauthenticated'}
        onClick={() => {
          navigate('/keys')
        }}
      >
        Keys
      </Button>
      <Box sx={{ flexGrow: 1 }}></Box>
      {props.currentPage == 'unauthenticated'
        ? <>
          <Button
            color="inherit"
            onClick={() => { login() }}
          >
            Log in
          </Button>
        </> : <>
          <Button
            color="inherit"
            endIcon={<KeyboardArrowDownIcon />}
            onClick={handleClick}
          >
            Account
          </Button>
          <Menu
            id="basic-menu"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={open}
            onClose={handleClose}
          >
            <MenuItem onClick={() => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              window.location.href = (window as any).FE_ENV.AUTH_SERVER_URL + '/realms/mimram/account'
            }}>Profile</MenuItem>
            <MenuItem onClick={async () => {
              handleClose()
              await logout()
            }}>Log out</MenuItem>
          </Menu>
        </>
      }
    </Toolbar>
  </AppBar>
}
