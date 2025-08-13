// Code related to TOTP manipulation

export const generateTotp = async (secret: string): Promise<string> => {
  try {
    const counter = Math.floor(Date.now() / 1000 / 30)
    const counterBytes = new ArrayBuffer(8)
    const counterBytesView = new DataView(counterBytes)
    counterBytesView.setBigUint64(0, BigInt(counter))

    const keyByteArray = base32Decode(secret)
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyByteArray,
      { name: "HMAC", hash: { name: "SHA-1" } },
      false,
      ["sign"]
    )

    const hmac = new Uint8Array(await crypto.subtle.sign("HMAC", cryptoKey, counterBytes));

    const offset = hmac[hmac.length - 1] & 0xf
    const code =
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff)

    return (code % 1000000).toString().padStart(6, "0")
  } catch (e) {
    console.log(e)
    return '------'
  }
}

/**
 * Decode a Base32 string into a Uint8Array
 */
const base32Decode = (input: string): Uint8Array<ArrayBuffer> => {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"
  let bits = ""
  const output: number[] = []

  for (const c of input.replace(/=+$/, "").toUpperCase()) {
    const val = alphabet.indexOf(c)
    if (val === -1) throw new Error(`Invalid base32 character: ${c}`)
    bits += val.toString(2).padStart(5, "0")
  }

  for (let i = 0; i + 8 <= bits.length; i += 8) {
    output.push(parseInt(bits.substring(i, i + 8), 2))
  }

  return new Uint8Array(output)
}
