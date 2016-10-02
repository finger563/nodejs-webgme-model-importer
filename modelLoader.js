
define(['q'], function(Q) {
    'use strict';
    return {
	loadModel: function(core, modelNode, doResolve, keepWebGMENodes) {
	    var self = this;
	    if (doResolve === undefined) {
		doResolve = false;
	    }
	    if (keepWebGMENodes === undefined) {
		keepWebGMENodes = false;
	    }

	    var nodeName = core.getAttribute(modelNode, 'name'),
	    nodePath = core.getPath(modelNode),
	    nodeType = core.getAttribute(core.getBaseType(modelNode), 'name'),
	    parentPath = core.getPath(core.getParent(modelNode)),
	    attributes = core.getAttributeNames(modelNode),
	    childPaths = core.getChildrenPaths(modelNode),
	    pointers = core.getPointerNames(modelNode),
	    sets = core.getSetNames(modelNode);

	    var model = {
		'objects': {
		},
		'root': nodePath
	    };
	    model.objects[nodePath] = {
		name: nodeName,
		path: nodePath,
		type: nodeType,
		parentPath: parentPath,
		childPaths: childPaths,
		attributes: {},
		pointers: {},
		sets: {}
	    };
	    if (keepWebGMENodes)
		model.objects[nodePath].node = modelNode;
	    attributes.map(function(attribute) {
		var val = core.getAttribute(modelNode, attribute);
		model.objects[nodePath].attributes[attribute] = val;
		model.objects[nodePath][attribute] = val;
	    });
	    pointers.map(function(pointer) {
		model.objects[nodePath].pointers[pointer] = core.getPointerPath(modelNode, pointer);
	    });
	    sets.map(function(set) {
		model.objects[nodePath].sets[set] = core.getMemberPaths(modelNode, set);
	    });
	    return core.loadSubTree(modelNode)
		.then(function(nodes) {
		    nodes.map(function(node) {
			nodeName = core.getAttribute(node, 'name');
			nodePath = core.getPath(node);
			nodeType = core.getAttribute(core.getBaseType(node), 'name');
			parentPath = core.getPath(core.getParent(node));
			attributes = core.getAttributeNames(node);
			childPaths = core.getChildrenPaths(node);
			pointers = core.getPointerNames(node);
			sets = core.getSetNames(node);
			model.objects[nodePath] = {
			    name: nodeName,
			    path: nodePath,
			    type: nodeType,
			    parentPath: parentPath,
			    childPaths: childPaths,
			    attributes: {},
			    pointers: {},
			    sets: {}
			};
			if (keepWebGMENodes)
			    model.objects[nodePath].node = node;
			attributes.map(function(attribute) {
			    var val = core.getAttribute(node, attribute);
			    model.objects[nodePath].attributes[attribute] = val;
			    model.objects[nodePath][attribute] = val;
			});
			pointers.map(function(pointer) {
			    model.objects[nodePath].pointers[pointer] = core.getPointerPath(node, pointer);
			});
			sets.map(function(set) {
			    model.objects[nodePath].sets[set] = core.getMemberPaths(node, set);
			});
		    });

		    if (doResolve)
			self.resolvePointers(model.objects);

		    model.root = model.objects[model.root]

		    return model;
		});
	},
	resolvePointers: function(objects) {
	    var self = this;
            var objPaths = Object.keys(objects);
	    objPaths.map(function(objPath) {
                var obj = objects[objPath];
		// Can't follow parent path: would lead to circular data structure (not stringifiable)
		// follow children paths, these will always have been loaded
		obj.childPaths.map(function(childPath) {
		    var dst = objects[childPath];
		    if (dst) {
			var key = dst.type + '_list';
			if (!obj[key]) {
			    obj[key] = [];
			}
			obj[key].push(dst);
		    }
		});
		// follow pointer paths, these may not always be loaded!
		for (var pointer in obj.pointers) {
		    var path = obj.pointers[pointer];
		    var dst = objects[path];
		    if (dst)
			obj[pointer] = dst;
                    else if (pointer != 'base' && path != null)
                        self.notify('error',
                            'Cannot save pointer to object outside tree: ' + 
                                pointer + ', ' + path);
		}
		// follow set paths, these may not always be loaded!
		for (var set in obj.sets) {
		    var paths = obj.sets[set];
		    var dsts = [];
		    paths.map(function(path) {
                        var dst = objects[path];
			if (dst)
			    dsts.push(dst);
                        else if (path != null)
                            self.notify('error',
                                'Cannot save set member not in tree: ' + 
                                    set + ', ' + path);
                    });
		    obj[set] = dsts;
		}
	    });
	}
    }
});
