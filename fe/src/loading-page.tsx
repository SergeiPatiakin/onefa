// Code related to the loading page component
import { CircularProgress } from "@mui/material"
import { NavBar } from "./navbar"

export const LoadingPage = () => {
  return (
    <>
      <NavBar currentPage="not-found" />
      <div style={{ paddingTop: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <CircularProgress size="200px"/>
      </div>
    </>
  )
}
