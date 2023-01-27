import { run } from "hardhat"

const verify = async (contractAddress: string, args: any[]) => {
  console.log("Verifying contract...")
  try {
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: args,
    })
  } catch (error) {
    if (error) {
      console.log("Error verifying contract on Etherscan:", error.message)
    }
  }
}

export { verify }
