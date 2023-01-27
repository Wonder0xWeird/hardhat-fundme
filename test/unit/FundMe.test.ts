import { assert, expect } from "chai"
import { deployments, ethers, getNamedAccounts, network } from "hardhat"
import { developmentChains } from "../../helper-hardhat-config"
import { FundMe, MockV3Aggregator } from "../../typechain-types"

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("FundMe", function() {
      let fundMe: FundMe
      let deployer: string
      let mockV3Aggregator: MockV3Aggregator
      const amountToFund = ethers.utils.parseEther("1")

      beforeEach(async function() {
        // const accounts = await ethers.getSigners()
        deployer = (await getNamedAccounts()).deployer
        await deployments.fixture(["all"])
        fundMe = await ethers.getContract("FundMe")
        mockV3Aggregator = await ethers.getContract("MockV3Aggregator")
      })

      describe("constructor", function() {
        it("should set the aggregator address correctly", async function() {
          const priceFeedAddress = await fundMe.getPriceFeed()
          assert.equal(priceFeedAddress, mockV3Aggregator.address)
        })
      })

      describe("fund", async function() {
        it("fails if eth amount is too low", async function() {
          await expect(fundMe.fund()).to.be.revertedWith(
            "You need to spend more ETH!"
          )
        })

        it("updates addressToAmountFunded mapping", async function() {
          await fundMe.fund({ value: amountToFund })
          const amountFunded = await fundMe.getAddressToAmountFunded(deployer)
          expect(amountFunded).to.be.equal(amountToFund)
        })

        it("pushes a new funder to the stack", async function() {
          await fundMe.fund({ value: amountToFund })
          const funder = await fundMe.getFunder(0)
          expect(funder).to.be.equal(deployer)
        })
      })

      describe("withdraw", async function() {
        beforeEach(async function() {
          await fundMe.fund({ value: amountToFund })
        })

        it("withdraws eth to single funder", async function() {
          const startingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          )
          const startingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          )

          const tx = await fundMe.withdraw()
          const txReceipt = await tx.wait(1)
          const gasCost = txReceipt.gasUsed.mul(txReceipt.effectiveGasPrice)

          const endingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          )
          const endingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          )

          //Expect
          expect(startingFundMeBalance).to.be.equal(amountToFund)
          expect(endingFundMeBalance).to.be.equal("0")
          expect(endingDeployerBalance.add(gasCost)).to.be.equal(
            startingDeployerBalance.add(startingFundMeBalance)
          )
        })

        it("allows withdraw with multiple funders", async function() {
          const accounts = await ethers.getSigners()
          for (let i = 1; i < 6; i++) {
            const fundMeConnectedContract = await fundMe.connect(accounts[i])
            await fundMeConnectedContract.fund({ value: amountToFund })
          }
          const startingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          )
          const startingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          )

          const tx = await fundMe.withdraw()
          const txReceipt = await tx.wait(1)
          const gasCost = txReceipt.gasUsed.mul(txReceipt.effectiveGasPrice)

          const endingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          )
          const endingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          )

          expect(endingFundMeBalance).to.be.equal(0)
          expect(endingDeployerBalance.add(gasCost)).to.be.equal(
            startingDeployerBalance.add(startingFundMeBalance)
          )

          expect(fundMe.getFunder(0)).to.be.reverted

          for (let i = 1; i < 6; i++) {
            expect(
              await fundMe.getAddressToAmountFunded(accounts[i].address)
            ).to.be.equal(0)
          }
        })

        it("only allows the owner to withdraw", async () => {
          const accounts = await ethers.getSigners()
          const attacker = accounts[1]
          const attackerConnectedContract = await fundMe.connect(attacker)

          await expect(
            attackerConnectedContract.withdraw()
          ).to.be.revertedWithCustomError(
            attackerConnectedContract,
            "FundMe__NotOwner"
          )
        })

        it("cheaperWidthdraw testing...", async function() {
          const accounts = await ethers.getSigners()
          for (let i = 1; i < 6; i++) {
            const fundMeConnectedContract = await fundMe.connect(accounts[i])
            await fundMeConnectedContract.fund({ value: amountToFund })
          }
          const startingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          )
          const startingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          )

          const tx = await fundMe.cheaperWithdraw()
          const txReceipt = await tx.wait(1)
          const gasCost = txReceipt.gasUsed.mul(txReceipt.effectiveGasPrice)

          const endingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          )
          const endingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          )

          expect(endingFundMeBalance).to.be.equal(0)
          expect(endingDeployerBalance.add(gasCost)).to.be.equal(
            startingDeployerBalance.add(startingFundMeBalance)
          )

          expect(fundMe.getFunder(0)).to.be.reverted

          for (let i = 1; i < 6; i++) {
            expect(
              await fundMe.getAddressToAmountFunded(accounts[i].address)
            ).to.be.equal(0)
          }
        })
      })
    })

export {}
