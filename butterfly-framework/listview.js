define(['butterfly/view',
  'butterfly/listview/DataSource',
  'butterfly/listview/ListView',
  'css!butterfly-framework/listview'
  ], function(View, DataSource, ListView){

  return View.extend({

    render: function(){

      this.datasource = new DataSource({
        storage: 'local',
        identifier: 'list-demo',
        url: "../mail/mock_inbox.json"
      });

      var listEl = this.el.querySelector("#mail-list");
      var template = _.template(this.$("#mail-template").html());
      this.listview = new ListView({
        id: 'list-demo',
        el: listEl,
        itemTemplate: template,
        dataSource: this.datasource
      });
      this.listenTo(this.listview, 'itemSelect', this.onItemSelect);
    },

    onItemSelect: function(listview, item, index, event) {
      alert('select:' + index);
    }
  });
});
