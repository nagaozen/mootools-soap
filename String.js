String.implement({
    
    sanitize: function(a, b) {
        var len = a.length,
            s = this;
        if(len !== b.length) throw new TypeError('Invalid procedure call. Both arrays should have the same size.');
        for(var i = 0; i < len; i++) {
            var re = new RegExp(a[i],'g');
            s = s.replace(re, b[i]);
        }
        return s;
    }
    
});
