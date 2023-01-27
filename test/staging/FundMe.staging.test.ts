import { BigNumber } from "ethers"
import { ethers, network, getNamedAccounts } from "hardhat"
import { developmentChains } from "../../helper-hardhat-config"
import { FundMe } from "../../typechain-types"
import { expect } from "chai"

developmentChains.includes(network.name)
  ? describe.skip
  : describe("FundMe", async () => {
      let fundMe: FundMe
      let deployer: string
      const amountToFund = ethers.utils.parseEther("0.035")

      beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer
        fundMe = await ethers.getContract("FundMe", deployer)
      })

      it("allows people to fund and withdraw", async () => {
        await fundMe.fund({ value: amountToFund })
        await fundMe.withdraw()
        const endingBalance = await fundMe.provider.getBalance(fundMe.address)
        expect(endingBalance).to.be.equal(0)
      })
    })
