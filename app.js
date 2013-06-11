(function() {
var customFields = [];
var assigneeUserId =null;
var workData = {};
var totalHours = 0;
  return {

    defaultState: 'loading',
    requests: {
     

      sendUsersData: function() {

        var  subdomain =  this.currentAccount().subdomain();
        var  userEmail = this.currentUser().email();
        var  zendeskToken = this.setting('zendeskToken');
        var  fbHost = this.setting('freshbookHost');
        var  fbToken = this.setting('freshbookToken');
        var  data = 'subdomain=' + subdomain + '&userEmail=' + userEmail + '&zendeskToken=' + zendeskToken + '&fbHost=' + fbHost + '&fbToken=' + fbToken;
      
        return {
          contentType: 'application/json',
          url: 'http://195.250.88.93:8081/createNewUser?'+data,
          type: 'GET'
         
        };
      },
      target: function(data){
        var customFieldsValue = '';
        for(var i=0; i < customFields.length; i++){
          customFieldsValue += ' '+customFields[i].key+' '+ customFields[i].value ;
        }
        var tiketData = 'id='+this.ticket().id() +'&userEmail=' + this.currentUser().email() +'&assignee_id=' + assigneeUserId +'&custom_fields=' + customFieldsValue +'&subject=' + this.ticket().subject() +'&description=' + this.ticket().description() + '&workDescription='+workData.workDescription + '&startTime='+workData.startTime+'&endTime=' + workData.endTime+'&workHours='+workData.workHours;
       console.log('test');
       console.log(tiketData);
         return {
          contentType: 'application/json',
          url: 'http://195.250.88.93:8081/ticketchanged?'+tiketData,
          type: 'GET'
        };
      }

    },

    // Here we define events such as a user clicking on something
    events: {

      // The app is active, so call requestBookmarks (L#65)
      'app.activated': 'appActivated',
     /* 'click .search-btn': 'doTheSearch',
      'searchZendesk.done': 'handleResults',
      'searchZendesk.fail': 'handleFail',*/

      'click .target': 'appTarget',
     
     

      '*.changed': function(data) {
         var propertyName = data.propertyName;
         if(propertyName.indexOf('ticket.custom_field') != -1){
            var insert = true;
            for(var i=0; i<customFields.length; i++){
              if(customFields[i].key == data.propertyName){
                customFields[i].value = data.newValue;
                insert = false;
                break;
              }
            }
            if(insert){
              customFields.push({key:data.propertyName, value:data.newValue});
              }
         }
         else
           if(propertyName.indexOf('ticket.assignee.user.id')!= -1){
              assigneeUserId = data.newValue;
           }
      }

    },
    init: function(data) {
      this.switchTo('addtime');
      var menualTemplate = this.renderTemplate('menual',{});
      this.$('.menualTimer').append(menualTemplate);
      this._addOptions(15);
    },

    appActivated : function(data){
        if(data.firstLoad) {
          this.saveUserSettings();
        }
        this.renderTarget(data);
        this.init();
    },
    saveUserSettings : function(){

       this.ajax('sendUsersData');
    },

    renderTarget : function(data){
      this.userName = this.currentUser().name();
    },

    appTarget:function(data){

        var desc = this.$('.menualTimer textarea').val();
        var start = this.$('.menualstart').val();
        var end = this.$('.menualend').val();
        var workHour =  this._workHours(start,end);
        workData = {
          workHours: workHour,
          workDescription :desc,
          startTime: start,
          endTime: end
        };
  
        this.ajax('target');
    },

    handleFail: function (data) {
      var response = JSON.parse(data.responseText);
      this.showError(response.error, response.description);
    },

     _addOptions:function(inc){
      var str = '';
      for(var i = 0 ; i < 2; i++){
        for(var j = 0; j<12; j++){
            var hour = (j > 0)? j : 12;
            var min = 0;
            while(min < 60){
             var amORpm = (i === 0)? 'am':'pm';
              var mStr = (min <10) ? '0'+min : min;
              var hStr = (hour <10) ? '0'+ hour : hour;
              var time = hStr + ':' + mStr + amORpm;
              str += '<option value = "'+ time +'">'+ time +'</option>';
              min += inc;
           }
        }
      }
      this.$('.start').html('<option>Start Time </option>'+str);
      this.$('.end').html('<option>End Time </option>'+str);
    },
    _workHours: function(start, end){
        var startLock = start.substr(start.length-2);
        var endLock = end.substr(end.length-2);

        var startH = (start.substring(0,1) > 0)? start.substring(0,2): start.substring(1,2);
        var endH = (end.substring(0,1) >0)? end.substring(0,2): end.substring(1,2);
       
        start = start.substring(3);
        end = end.substring(3);
        var startM = (start.substring(0,1) > 0)? start.substring(0,2): start.substring(1,2);
        var endM =  (end.substring(0,1) > 0)? end.substring(0,2) : end.substring(1,2);
        var workH=0, workM=0 ,em = 0, sm = 0;
        
       if(startLock === endLock && startH <= endH){
            sm= (startH === '12')? startM : startH*60 + startM*1;
            em= (endH === '12')? endM: endH*60 + endM *1;
            console.log(sm);
            console.log(em);

            workH = (em - sm)/60;
        }
        else if(startLock === 'am' && endLock === 'pm'){
             sm= (startH === 12)? startM: startH*60 + startM*1;
             em= (endH === 12)? (12-startH)*60 +endM: (12-startH)*60+ endH*60 + endM*1;
            workH = (em - sm)/60;
        }


        return workH;
    }
   
  };

}());