export {gd_root, gd_type_name, param}

const gd_root = "c:/golden/gdc/"

let gd_type = -1
for (let i = 2; i < process.argv.length; i++) {
	const a = process.argv[i]
	const n = a.search("/type=")
    if (n != -1) {
		gd_type = Number(a.substr(6))
		break
	}
}
const gd_type_list = ["product", "debug", "lock"]
const gd_type_name = gd_type_list[gd_type]

const gd_ver_file_rc = ""
const gd_new_exe_size = 0
const gd_is_ftp = false

const param = {
	git: {
		origin: "origin",
		checkout: "master"
	},
	path: {
		util: {
			delphi: "C:/Delphi5/Bin/",
			editbin: "C:/Program Files (x86)/Microsoft Visual Studio/2019/Community/VC/Tools/MSVC/14.28.29333/bin/Hostx64/x64/",
			winrar: "C:/Program Files/WinRAR/"
		},
		update: {
			cfg: "gedemin/gedemin/",
			exe: "gedemin/EXE/",
		 	sql: "gedemin/SQL/",
			dcu: "gedemin/DCU/",    
		}
	},
	stdio: {
		git: ['ignore', 'pipe', 'ignore'],
		cmd: ['ignore', 'pipe', 'ignore'],
		dcc: ['ignore', 'pipe', 'ignore']
	},
	timeout: {
		git: 30 * 1000,
		cmd: 10 * 1000,
		dcc: 60 * 1000
	},
	maxBuffer: {
		git: 1024 * 128,
		cmd: 1024 * 128,
		dcc: 1024 * 1024 * 2
	},
	exe: {
		gedemin: "gedemin.exe",
		gdcc: "gdcc.exe",
		gedemin_upd:"gedemin_upd.exe"
	},
	dpr: {
		gedemin: "gedemin.dpr",
		gdcc: "gdcc.dpr",
		gedemin_upd: "gedemin_upd.dpr"
	},
	cfg: {
		gedemin: {
			project: { file_name: "gedemin.cfg" },
			current: { file_name: "gedemin.current.cfg" },
			product: 
				{	file_name: "gedemin.product.cfg",
					compiler_switch: "-b",
					arc_name: "gedemin.rar",
					target_dir: "beta"
				},
			debug: 				
				{	file_name: "gedemin.debug.cfg",
					compiler_switch: "-b -vt",
					arc_name: "gedemin_debug.rar",
					target_dir: "debug"
				},
			lock:
				{	file_name: "gedemin.lock.cfg",
					compiler_switch: "-b",
					arc_name: "gedemin_lock.rar",
					target_dir: "lock"
				},
		}
	}
}

try {
	const tn = param.cfg.gedemin[gd_type_name].file_name
	console.log(`Process with ${tn}`)
} catch(err) {
	console.log(`${err}\n  Option /type=Number wrong!\n  Number must be index of [${gd_type_list}]`)
	process.exit(err)
}
