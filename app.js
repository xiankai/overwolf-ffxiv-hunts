(function() {
	angular
	.module('overwolf', ['ui.bootstrap', 'ui.select'])
	.filter('moment', MomentFilter)
	.controller('table', Controller)

	Controller.$inject = ['$http', '$interval'];
	function Controller($http, $interval) {
		var vm = this;

		var locationMap = {
			'iterative': {
				'La Noscea': ['Eastern', 'Western', 'Middle', 'Lower', 'Upper', 'Outer'],
				'Thanalan': ['Eastern', 'Western', 'Northern', 'Southern', 'Central'],
				'Shroud': ['East', 'North', 'South', 'Central']
			},
			'declarative': {
				'Coerthas': ['Coerthas Western Highlands', 'Coerthas Central Highlands'],
				'Dravania': ['The Dravanian Forelands', 'The Dravanian Hinterlands', 'The Churning Mists'],
				'Abalathia\'s Spine': ['The Sea of Clouds', 'Azys Lla']
			}
		};

		vm.locations = [];
		for (var method in locationMap) {
			if (method === 'iterative') {
				for (var region in locationMap[method]) {
					for (var area in locationMap[method][region]) {
						vm.locations.push({
							name: locationMap[method][region][area] + ' ' + region,
							region: region
						});
					}
				}
			}

			if (method === 'declarative') {
				for (var region in locationMap[method]) {
					for (var area in locationMap[method][region]) {
						vm.locations.push({
							name: locationMap[method][region][area],
							region: region
						});
					}
				}
			}
		}

		vm.resetFilters = function() {
			vm.input.type = '';
			vm.input.rank = '';
			vm.input.area = '';
		}

		vm.locationGroupFn = function(item) {
			return item.value.region;
		}

		function getHuntData() {
			$http.get('https://api.import.io/store/data/9ad33e79-bc92-44f9-81c6-fead89c71fce/_query?input/webpage/url=http%3A%2F%2Fffxivhunt.com%2Fjenova&_user=a6e81023-a9c4-4a6c-9c0d-460d95e5fec6&_apikey=a6e81023a9c44a6c9c0d460d95e5fec6ecc04ef7e8d5fc5821b807d966668c009017bb2e6cc1f62951b7f5bafee84210b5a14c8f3655daa233abd91561764fb3d050ffc9598ee59e2755276c9afcb6e3', {

			}).then(function(response) {
				vm.hunts = response.data.results.map(transformData);
				$interval.cancel(currentInterval);
				countdown();
			}, function() {
				// error
			});
		}

		function transformData(hunt) {
			var timeDetails = parseTime(hunt.time);
			var duration = timeDetails.duration;

			return {
				name: hunt.hunts,
				area: hunt.area,
				rank: hunt.rank,
				type: timeDetails.type,
				time: duration
			}
		}

		var currentInterval;
		function countdown() {
			currentInterval = $interval(function() {
				vm.hunts.map(function(hunt) {
					switch (hunt.type) {
						case 'open': 
						case 'no info':
							hunt.time.add(1, 'second');
							break;
						case 'awaiting':
							hunt.time.subtract(1, 'second');
							break;
					}
				})
			}, 1000);
		}

		/**
		 * @param timeString
		 * @return {
		 * 		type: [awaiting|open|no info]
		 * 		duration: Moment.duration()
		 * }
		 */
		function parseTime(timeString) {
			var duration, type;

			// "Next pop in: 03:27:59"
			if (timeString.indexOf('Next pop in') !== -1) {
				duration = moment.duration(timeString.substr(-8));
				type = 'awaiting';
			}

			if (timeString.indexOf('open since') !== -1) {
				type = 'open';

				if (timeString.indexOf('min') !== -1) {
					// "open since 12min"
					duration = moment.duration(parseInt(timeString.substr(-5)), 'minutes');
				} else {
					// "open since 1:28"
					duration = moment.duration(timeString);
				}
			}

			// "no info for 13:34"
			if (timeString.indexOf('no info for') !== -1) {
				type = 'no info';
				duration = moment.duration(timeString);
			}

			return {
				type: type,
				duration: duration
			}
		}

		getHuntData();
		$interval(function() {
			getHuntData();
		}, 15000)
	}

	function MomentFilter() {
		return function(duration) {
			return moment.utc(duration.asMilliseconds()).format("HH:mm:ss");
		}
	}
	
})();