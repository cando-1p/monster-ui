define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster'),
		timezone = require('monster-timezone');

	var account = {

		subscribe: {
			'myaccount.account.renderContent': '_accountRenderContent'
		},

		_accountRenderContent: function(args){
			var self = this;

			self.accountGetData(function(data) {
				var accountTemplate = $(monster.template(self, 'account-layout', data));

				self.accountBindEvents(accountTemplate, data);

				monster.pub('myaccount.renderSubmodule', accountTemplate);

				args.callback && args.callback(accountTemplate);
			});
		},

		accountBindEvents: function(template, data) {
			var self = this;

			monster.pub('common.carrierSelector', {
				container: template.find('#carrierSelectorContainer'),
				data: { 
					noMatch: data.noMatch,
					accountData: data.account
				},
				callbackAfterSave: function(data) {
					// Refresh page and highlight field
					self._accountRenderContent({ 
						callback: function(accountTemplate) {
							self.highlightField(accountTemplate, 'carrier');
						}
					});
				}
			});

			timezone.populateDropdown(template.find('#account_timezone'), data.account.timezone);
			template.find('#account_timezone').chosen({ search_contains: true, width: '100%' });

			monster.pub('myaccount.events', {
				template: template,
				data: data
			});
		},

		accountGetNoMatch: function(callback) {
			var self = this;

			self.callApi({
				resource: 'callflow.list',
				data: {
					accountId: self.accountId,
					filters: {
						filter_numbers: 'no_match'
					}
				},
				success: function(listCallflows) {
					if(listCallflows.data.length === 1) {
						self.callApi({
							resource: 'callflow.get',
							data: {
								callflowId: listCallflows.data[0].id,
								accountId: self.accountId
							},
							success: function(callflow) {
								callback(callflow.data);
							}
						});
					}
					else {
						callback({});
					}
				}
			});
		},

		accountGetData: function(globalCallback) {
			var self = this;

			monster.parallel({
					account: function(callback) {
						self.callApi({
							resource: 'account.get',
							data: {
								accountId: self.accountId
							},
							success: function(data, status) {
								callback && callback(null, data.data);
							}
						});
					},
					noMatch: function(callback) {
						self.accountGetNoMatch(function(data) {
							callback && callback(null, data);
						})
					}
				},
				function(err, results) {
					self.accountFormatData(results, globalCallback);
				}
			);
		},

		accountFormatData: function(data, globalCallback) {
			var self = this;

			monster.pub('common.carrierSelector.getDescription', {
				data: {
					noMatch: data.noMatch,
					accountData: data.account
				},
				callback: function(description) {
					data.carrierDescription = description;

					globalCallback && globalCallback(data);
				}
			});
		}
	};

	return account;
});