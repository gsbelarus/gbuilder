/* works with "noImplicitAny": false in tsconfig.json */

import {gd_root, gd_type_name, param} from "./param"

const cmd = require("child_process").execSync
const exec = require("child_process").execFileSync

function update_gedemin() {
	let ret = `Update Gedemin:`
	console.time("elapsed time git")
	let resExec = ""
	let execPath = gd_root
	let strUpToDate = "up to date"
	let execFile = "git"
	let execArgs = ["checkout"]
	let execOptions = {
		timeout: param.timeout.git,
		cwd: execPath,
		stdio: param.stdio.git,
		maxBuffer: param.maxBuffer.git
	}
	try {
		resExec = exec(execFile, execArgs, execOptions).toString()
	} catch(err) {
		ret = `${ret}\nCheckout is wrong!`
		return ret
	}
	//console.log(resExec)
	let isUpToDate = resExec.search(strUpToDate) > 0
	isUpToDate = false // for test only, comment on production build
	ret = `${ret}\n  checkout is up to date: ${isUpToDate}`
	if (isUpToDate) {
		return ret
	}

	execArgs = ["pull", param.git.origin, param.git.checkout]
	try {
		resExec = exec(execFile, execArgs, execOptions).toString()
	} catch(err) {
		ret = `${ret}\nPull is wrong!`
		return ret
	}
	//console.log(resExec)
	isUpToDate = resExec.search(strUpToDate) > 0
	isUpToDate = false // for test only, comment on production build
	ret = `${ret}\n  pull is up to date: ${isUpToDate}`
	if (isUpToDate) {
		return ret
	}
	console.timeEnd("elapsed time git")

	ret = `${ret}\n  ready to compile`

	console.time("elapsed time prepare")
	let cmdPath = (gd_root + param.path.update.dcu).replace(/\//gi, "\\")
	let cmdFile = `dir ${cmdPath}*.dcu`
	let cmdArgs = null
	let cmdOptions = {
		timeout: param.timeout.cmd,
		stdio: param.stdio.cmd,
	}
	let resCmd = ""
	try {
		resCmd = cmd(cmdFile, cmdArgs, cmdOptions).toString()
	} catch(err) {
		resCmd = ""
	}
	//console.log(resCmd)	
	let isExist = resCmd.search(".dcu") > 0
	//console.log(isExist)
	if (isExist) {
		ret = `${ret}\n` + `  dcu found`
		cmdFile = cmdFile.replace(/dir/, "del") + " /q"
		resCmd = cmd(cmdFile, cmdArgs, cmdOptions).toString()
		//console.log(resCmd)
		ret = `${ret}\n` + `  dcu deleted`
	} else {
		ret = `${ret}\n` + `  dcu not found`
	}
	
	cmdPath = (gd_root + param.path.update.cfg).replace(/\//gi, "\\")
	let cfgFile = param.cfg.gedemin[gd_type_name].file_name
	cmdFile = `copy ${cmdPath}${param.cfg.gedemin.project.file_name} ${cmdPath}${param.cfg.gedemin.current.file_name} /y`
	resCmd = cmd(cmdFile, cmdArgs, cmdOptions).toString()
	cmdFile = `copy ${cmdPath}${cfgFile} ${cmdPath}${param.cfg.gedemin.project.file_name} /y`
	resCmd = cmd(cmdFile, cmdArgs, cmdOptions).toString()

	cmdPath = (gd_root + param.path.update.exe).replace(/\//gi, "\\")
	cmdFile = `del ${cmdPath}${param.exe.gedemin} /q`
	resCmd = cmd(cmdFile, cmdArgs, cmdOptions).toString()
	cmdFile = `dir ${cmdPath}${param.exe.gedemin}`
	try {
		resCmd = cmd(cmdFile, cmdArgs, cmdOptions).toString()
	} catch(err) {
		resCmd = ""
	}
	isExist = resCmd.search(`${param.exe.gedemin}`) > 0
	if (isExist) {
		ret = `${ret}\nCan not delete ${param.exe.gedemin}!`
		return ret
	} else {
		ret = `${ret}\n  ${param.exe.gedemin} deleted`
	}
	console.timeEnd("elapsed time prepare")

	console.time("elapsed time dcc32")
	execPath = gd_root + param.path.update.cfg
	execFile = param.path.util.delphi + "dcc32.exe"
	execArgs = [param.cfg.gedemin[gd_type_name].compiler_switch, param.dpr.gedemin]
	execOptions = {
		timeout: param.timeout.dcc,
		cwd: execPath,
		stdio: param.stdio.dcc,
		maxBuffer: param.maxBuffer.dcc
	}
	try {
		resExec = exec(execFile, execArgs, execOptions).toString()
	} catch(err) {
		ret = `${ret}\nCompile ${param.exe.gedemin} is wrong!`
		return ret
	}
	//console.log(resExec)
	ret = `${ret}\n` + `  ${param.exe.gedemin} built`
	console.timeEnd("elapsed time dcc32")

	cmdPath = (gd_root + param.path.update.cfg).replace(/\//gi, "\\")
	cmdFile = `copy ${cmdPath}${param.cfg.gedemin.current.file_name} ${cmdPath}${param.cfg.gedemin.project.file_name} /y`
	resCmd = cmd(cmdFile, cmdArgs, cmdOptions).toString()
	cmdFile = `del ${cmdPath}${param.cfg.gedemin.current.file_name} /q`
	resCmd = cmd(cmdFile, cmdArgs, cmdOptions).toString()

	ret = `${ret}\n` + `Update Gedemin completed!`
	return ret
}

/*
console.time("elapsed time all")
const msg = update_gedemin()
console.log(msg)
console.timeEnd("elapsed time all")
*/