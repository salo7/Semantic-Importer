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
});

$('tbody input.select-row').click(function(e){
	var self = $(this);
	if(self.prop('checked')){
		self.closest('tr').addClass('selected');
	}
	else{
		self.closest('tr').removeClass('selected');
	}
});