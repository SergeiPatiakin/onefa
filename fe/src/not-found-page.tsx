// Code related to the Not Found page component
import { Container } from "@mui/material"
import { NavBar } from "./navbar"
import reactLogo from './assets/react.svg'

export const NotFoundPage = () => {
  return (
    <>
      <NavBar currentPage="not-found" />
      <Container>
        <h2>Page Not Found</h2>
        <img src={reactLogo} />
      </Container>
    </>
  )
}
