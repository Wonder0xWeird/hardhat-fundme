import { getNamedAccounts, network, ethers } from "hardhat"

const main = async () => {
  const deployer = (await getNamedAccounts()).deployer
  const fundMe = await ethers.getContract("FundMe", deployer)
  console.log("Funding Contract...")
  const tx = await fundMe.fund({ value: ethers.utils.parseEther("0.1") })
  const txReceipt = await tx.wait(1)
  console.log("Funded!")
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.log(e)
    process.exit(1)
  })
