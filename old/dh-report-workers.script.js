import * as lib from 'dh-lib.script';

var jobs = ['hack', 'grow', 'weaken'];
var ws = lib.workers();

for (var wID in ws) {
    worker = ws[wID];
    worker.job = '';
    
    if (worker.ram > 0) {
        for (var jID in jobs) {
            var job = jobs[jID];
            if (scriptRunning('dh-worker-' + job + '.script', worker.name)) {
                worker.job = job;
            }
        }
    }
    
    tprint(lib.printWorker(worker));
}