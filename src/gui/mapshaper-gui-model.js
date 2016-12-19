/* @requires mapshaper-gui-lib */

function Model() {
  var datasets = [],
      editing;

  this.forEachLayer = function(cb) {
    var i = 0;
    datasets.forEach(function(dataset) {
      dataset.layers.forEach(function(lyr) {
        cb(lyr, dataset, i++);
      });
    });
  };

  this.deleteLayer = function(lyr, dataset) {
    var layers = dataset.layers;
    layers.splice(layers.indexOf(lyr), 1);
    if (layers.length === 0) {
      this.removeDataset(dataset);
    }
  };

  this.findLayer = function(target) {
    var found = null;
    this.forEachLayer(function(lyr, dataset) {
      if (lyr == target) {
        found = layerObject(lyr, dataset);
      }
    });
    return found;
  };

  // layer panel (after deletion)
  this.findAnotherLayer = function(target) {
    var layers = this.getLayers(),
        found = null;
    if (layers.length > 1) {
      found = layers[0].layer == target ? layers[1] : layers[0];
    }
    return found;
  };

  this.removeDataset = function(target) {
    if (target == (editing && editing.dataset)) {
      error("Can't remove dataset while editing");
    }
    datasets = datasets.filter(function(d) {
      return d != target;
    });
  };

  this.getDatasets = function() {
    return datasets;
  };

  this.getLayers = function() {
    var layers = [];
    this.forEachLayer(function(lyr, dataset) {
      layers.push(layerObject(lyr, dataset));
    });
    return layers;
  };

  // gui (console)
  this.selectNextLayer = function() {
    var layers = this.getLayers(),
        idx = indexOfLayer(editing.layer, layers),
        next;
    if (layers.length > 1 && idx > -1) {
      next = layers[(idx + 1) % layers.length];
      this.selectLayer(next.layer, next.dataset);
    }
  };

  // gui (console)
  this.selectPrevLayer = function() {
    var layers = this.getLayers(),
        idx = indexOfLayer(editing.layer, layers),
        prev;
    if (layers.length > 1 && idx > -1) {
      prev = layers[idx === 0 ? layers.length - 1 : idx - 1];
      this.selectLayer(prev.layer, prev.dataset);
    }
  };

  // gui (vs setEditingLayer())
  this.selectLayer = function(lyr, dataset) {
    this.updated({select: true}, lyr, dataset);
  };

  // gui (import)
  this.addDataset = function(dataset) {
    this.updated({select: true, import: true}, dataset.layers[0], dataset);
  };

  // gui
  this.updated = function(flags, lyr, dataset) {
    var e;
    flags = flags || {};
    if (lyr && dataset && (!editing || editing.layer != lyr)) {
      setEditingLayer(lyr, dataset); // *
      flags.select = true;
    }
    if (editing) {
      if (flags.select) {
        this.dispatchEvent('select', editing);
      }
      e = utils.extend({flags: flags}, editing);
      this.dispatchEvent('update', e);
    }
  };

  this.getEditingLayer = function() {
    return editing || {};
  };


  function setEditingLayer(lyr, dataset) {
    if (editing && editing.layer == lyr) {
      return;
    }
    if (dataset.layers.indexOf(lyr) == -1) {
      error("Selected layer not found");
    }
    if (datasets.indexOf(dataset) == -1) {
      datasets.push(dataset);
    }
    editing = layerObject(lyr, dataset);
  }

  function layerObject(lyr, dataset) {
    return {
      layer: lyr,
      dataset: dataset
    };
  }

  // gui
  function indexOfLayer(lyr, layers) {
    var idx = -1;
    layers.forEach(function(o, i) {
      if (o.layer == lyr) idx = i;
    });
    return idx;
  }
}

utils.inherit(Model, EventDispatcher);
