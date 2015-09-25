$(function() {

	//$('body').append('<script src="/js/bootstrap.min.js"></script>');
	$('table tbody tr').click(function(e){

		var self = $(this);
		var checkbox = self.find('input.select-row');

		if(!self.hasClass('selected')){
			checkbox.prop('checked', true);
			self.addClass('selected');
		}
		else{
			checkbox.prop('checked', false);
			self.removeClass('selected');
		}
		return true;
	});

	// 	if (e.target.nodeName !== "INPUT"){
	// 		$(this).find('input.select-row').click();
	// 	}
	// 	return false;
	// });

	$('#select-all').click(function(){
		$('tbody tr:not(.duplicate) input.select-row').click();
		return true;
	});

	// $('tbody input.select-row').click(function(e){
	// 	$(this).closest('tr').click();
	// 	// var self = $(this);
	// 	// var row = self.closest('tr');

	// 	// if(!row.hasClass('selected')){
	// 	// 	// self.prop('checked', true);
	// 	// 	row.addClass('selected');
	// 	// }
	// 	// else{
	// 	// 	// self.prop('checked', false);
	// 	// 	row.removeClass('selected');
	// 	// }
	// 	e.preventDefault();
	// 	return false;
	// });

	
	$('.import-pubs').click(function(e){
		var selectedPubs = [];
		$('.select-row:checked').each(function(i,item){selectedPubs.push(item.value)});
	});
	

	$('tr.duplicate:not(.identical-duplicate)').click(function(e){
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

	$('#compare-duplicates-modal').on('show.bs.modal', function (event) {
	  var button = $(event.relatedTarget) // Button that triggered the modal
	  var modal = $(this)
	  modal.find('.modal-title').text('Compare publications');
	})

});