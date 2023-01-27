import { getNamedAccounts, network, ethers } from "hardhat"

const main = async () => {
  const deployer = (await getNamedAccounts()).deployer
  const fundMe = await ethers.getContract("FundMe", deployer)
  console.log("Withdrawing Funds...")
  const tx = await fundMe.withdraw()
  const txReceipt = await tx.wait(1)
  console.log("Withdrawn!")
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.log(e)
    process.exit(1)
  })
