$(function() {

	//$('body').append('<script src="/js/bootstrap.min.js"></script>');
	$('table tbody tr').click(function(e){
		//var checkBox = 
		$(this).find('input.select-row').click();
		/*
		if(checkBox.prop('checked')){
			checkBox.prop('checked',false);
			$(this).removeClass('selected');
		}
		else{
			checkBox.prop('checked',true);	
			$(this).addClass('selected');
		}
		*/
	});

	$('#select-all').click(function(){
		$('tbody input.select-row').click();
		return false;
	});

	$('tbody input.select-row').click(function(e){
		var self = $(this);
		if(self.prop('checked')){
			self.closest('tr').addClass('selected');
		}
		else{
			self.closest('tr').removeClass('selected');
		}
		return false;
	});

	/*
	$('#import-pubs).click(function(e){
		var selectedPubs = [];
		$('.select-row:checked').each(function(i,item){selectedPubs.push(item.value)});
	});
	*/

	$('tr.duplicate').click(function(e){
		var extSourceID = $(this).find('td.publication-id :checkbox[name=extSourceID]').val();
		$.get( '/publicationCompare/?pubKey=' + extSourceID, function(result) {
	      $('#compare-duplicates-modal').find('.modal-content').html(result);
	      $('#compare-duplicates-modal').modal({show: 'true'});
		}).fail(function() {
	    alert( "error" );
	  });

		// $('#compare-duplicates-modal').modal({show: 'true', remote: '/publicationCompare/?pubKey=' + extSourceID});
		return false;
	});

	$('#compare-duplicates-modal')
	.on('click', '.copy-to-right', function(e){
		var fromField = $(this).closest('.row').find('.field-wrapper').find('.form-control');
		var toField = $(this).closest('.form-wrapper').next('.form-wrapper').find('[name=' + fromField.prop('name') + ']');
		toField.val(fromField.val());
	}).on('click', '.copy-to-left', function(e){
		var toField = $(this).closest('.row').find('.field-wrapper').find('.form-control');
		var fromField = $(this).closest('.form-wrapper').next('.form-wrapper').find('[name=' + toField.prop('name') + ']');
		toField.val(fromField.val());
	});

});