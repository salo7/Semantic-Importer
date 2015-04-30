$('table tbody tr').click(function(e){
	var checkBox = $(this).find('input.select-row');
	if(checkBox.prop('checked')){
		checkBox.prop('checked',false);
		$(this).removeClass('selected');
	}
	else{
		checkBox.prop('checked',true);	
		$(this).addClass('selected');
	}
});

$('#select-all').click(function(){
	if($(this).prop('checked')){
		$('tbody input.select-row').prop('checked',true);	
	}
	else{
		$('tbody input.select-row').prop('checked',false);	
	}
});

$('tbody input.select-row').click(function(e){
	e.preventDefault();
});