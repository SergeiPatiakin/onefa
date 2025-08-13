// Code related to the Unauthenticated page component
import { Button, Container } from "@mui/material"
import { NavBar } from "./navbar"
import { login } from "./api-client"

export const UnauthenticatedPage = () => {
  return (
    <>
      <NavBar currentPage="unauthenticated" />
      <Container>
        <h2>Fight back against forced MFA!</h2>
        <p>
          Authentication for online accounts is a tradeoff between security and convenience.
          The tradeoff for your accounts should be your decision - you might choose multi-factor
          authentication for some accounts and simple password authentication for others.
        </p>
        <p>
          Unfortunately more and more online services are forcing the use of multi-factor
          authentication without any regard for user choice. <b>1FA</b> is an online authenticator
          app that you can access from any browser, without needing additional devices.
        </p>
        <Button onClick={() => {login()}}  variant="contained">Log in</Button>
      </Container>
    </>
  )
}
