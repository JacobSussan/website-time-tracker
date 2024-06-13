function updateTimes() {
	chrome.runtime.sendMessage({ action: "getTimeSpent" }, response => {
		const timeList = document.getElementById('timeList');
		timeList.innerHTML = '';

		for (const [domain, time] of Object.entries(response)) {
			const div = document.createElement('div');
			let formattedTime;

			if (time < 60) {
				formattedTime = `${Math.round(time)} seconds`;
			} else if (time < 3600) {
				formattedTime = `${Math.floor(time / 60)} minutes ${Math.round(time % 60)} seconds`;
			} else {
				formattedTime = `${Math.floor(time / 3600)} hours ${Math.floor((time % 3600) / 60)} minutes`;
			}

			div.textContent = `${domain}: ${formattedTime}`;
			timeList.appendChild(div);
		}
	});
}

// Update times immediately when the popup is loaded
document.addEventListener('DOMContentLoaded', () => {
	updateTimes();
	// Refresh times every second
	setInterval(updateTimes, 1000);
});
