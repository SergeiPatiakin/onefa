// Code related to the TOTP key delete dialog component
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material"
import { deleteTotpKey, type TotpKey } from "./api-client"
import { useQueryClient } from "@tanstack/react-query"

type KeyDeleteDialogProps = {
  totpKey: TotpKey
  onClose: () => void
}

export const KeyDeleteDialog = (props: KeyDeleteDialogProps) => {
  const queryClient = useQueryClient()
  return <Dialog open={true} onClose={props.onClose}>
    <DialogTitle>Delete Key</DialogTitle>
    <DialogContent>
      <DialogContentText>
        Delete key <b>{props.totpKey.name}</b>?
      </DialogContentText>
    </DialogContent>
    <DialogActions>
      <Button onClick={props.onClose}>Cancel</Button>
      <Button variant="contained" color="error" onClick={async () => {
        // Delete report
        await deleteTotpKey(props.totpKey.id)
        queryClient.invalidateQueries({ queryKey: ['totp-keys'] })
        props.onClose()
      }}>Delete</Button>
    </DialogActions>
  </Dialog>
}
