'use strict'

const chai = require('chai')
const rewire = require('rewire')
const sinon = require('sinon')
const sinonChai = require('sinon-chai')
const expect = chai.expect
chai.use(sinonChai)

const logger = require('../../lib/logger')
const CiBase = rewire('../../lib/ci/base')

describe('CiBase', function () {
  let execStub, revertExecRewire, base, sandbox
  beforeEach(function () {
    sandbox = sinon.sandbox.create()

    // get rid of all logging messages in the tests (and let us test for them if we want)
    sandbox.stub(logger, 'log')

    // stub out the top-level 'exec'
    execStub = sandbox.stub()
    revertExecRewire = CiBase.__set__('exec', execStub)

    base = new CiBase({id: 'config', branch: 'my-branch'}, {id: 'vcs'})
  })

  afterEach(function () {
    // undo the rewiring
    revertExecRewire()

    // remove all stubs/spies
    sandbox.restore()
  })

  it('should save the config', function () {
    expect(base.config).to.be.eql({id: 'config', branch: 'my-branch'})
  })

  it('should save the vcs', function () {
    expect(base.vcs).to.be.eql({id: 'vcs'})
  })

  describe('.add()', function () {
    let result
    beforeEach(function () {
      execStub.returns(Promise.resolve('added'))
      return base.add(['foo', 'bar', 'baz']).then((res) => {
        result = res
      })
    })

    it('should add the files to git', function () {
      expect(execStub).to.have.been.calledWith('git add foo bar baz')
    })

    it('should resolve with the result of the git command', function () {
      expect(result).to.be.equal('added')
    })
  })

  describe('.commit()', function () {
    let result
    beforeEach(function () {
      execStub.returns(Promise.resolve('committed'))
      return base.commit('my summary message', 'my detail message').then((res) => {
        result = res
      })
    })

    it('should commit the files to git', function () {
      expect(execStub).to.have.been.calledWith('git commit -m "my summary message" -m "my detail message"')
    })

    it('should resolve with the result of the git command', function () {
      expect(result).to.be.equal('committed')
    })
  })

  describe('.push()', function () {
    let result
    beforeEach(function () {
      execStub.returns(Promise.resolve('pushed'))
      return base.push().then((res) => {
        result = res
      })
    })

    it('should log that it is about to push', function () {
      expect(logger.log).to.have.been.calledWith('Pushing my-branch to origin')
    })

    it('should push origin to master with --tags', function () {
      expect(execStub).to.have.been.calledWith('git push origin my-branch --tags')
    })

    it('should resolve with the result of the git command', function () {
      expect(result).to.be.equal('pushed')
    })
  })

  describe('.setupGitEnv()', function () {
    let result
    beforeEach(function () {
      base.config = {
        ci: {
          gitUser: {
            email: 'ci-user@domain.com',
            name: 'ci-user'
          }
        }
      }

      execStub.returns(Promise.resolve('executed'))
      return base.setupGitEnv().then((res) => {
        result = res
      })
    })

    it('should configure the git user\'s email address', function () {
      expect(execStub).to.have.been.calledWith('git config --global user.email "ci-user@domain.com"')
    })

    it('should configure the git user\'s name', function () {
      expect(execStub).to.have.been.calledWith('git config --global user.name "ci-user"')
    })

    it('should resolve with the result of the git command', function () {
      expect(result).to.be.equal('executed')
    })
  })
})
