
function init() {
  // Grab a reference to the dropdown select element
  var selector = d3.select("#selDataset");

  // Use the list of sample names to populate the select options
  d3.json("samples.json").then((data) => {
    var sampleNames = data.names;

    sampleNames.forEach((sample) => {
      selector
        .append("option")
        .text(sample)
        .property("value", sample);
    });

    // Use the first sample from the list to build the initial plots
    var firstSample = sampleNames[0];
    buildCharts(firstSample);
    buildMetadata(firstSample);
  });
}

// Initialize the dashboard
init();

function optionChanged(newSample) {
  // Fetch new data each time a new sample is selected
  buildMetadata(newSample);
  buildCharts(newSample);
}

// Demographics Panel 
function buildMetadata(sample) {
  d3.json("samples.json").then((data) => {
    var metadata = data.metadata;
    // Filter the data for the object with the desired sample number
    var resultArray = metadata.filter(sampleObj => sampleObj.id == sample);
    var result = resultArray[0];
    // Use d3 to select the panel with id of `#sample-metadata`
    var PANEL = d3.select("#sample-metadata");

    // Use `.html("") to clear any existing metadata
    PANEL.html("");

    // Use `Object.entries` to add each key and value pair to the panel
    // Hint: Inside the loop, you will need to use d3 to append new
    // tags for each key-value in the metadata.
    
    //var start = performance.now()
    for (category in result) {
      PANEL.append("h5").text(`${category.toUpperCase()}: ${result[category]}`)
    } 

  });
}

function buildCharts(sample) {
  // Use d3.json to load the samples.json file 
  d3.json("samples.json").then((data) => {
    // 1. Create a variable that filters the metadata array for the object with the desired sample number.
    var metadata = data.metadata;
    var resultArrayMetadata = metadata.filter(sampleObj => sampleObj.id == parseInt(sample));
    //expected result: 1 object matching ID

    // Create a variable that holds the first sample in the array.
    var samples = data.samples;
    var resultArraySamples = samples.filter(sampleObj=> parseInt(sampleObj.id) == sample);
    
    // 2. Create a variable that holds the first sample in the metadata array.
    var metadataResult = resultArrayMetadata[0];

    // Create variables that hold the otu_ids, otu_labels, and sample_values.
    var sampleResult = resultArraySamples[0];
    
    var all_otu_ids = sampleResult.otu_ids;
    var all_otu_labels = sampleResult.otu_labels;
    var all_sample_values = sampleResult.sample_values;
        
    // 3. Create a variable that holds the washing frequency.
    var wash_frequency = parseFloat(metadataResult.wfreq);

    // Create the yticks for the bar chart.
    // Hint: Get the the top 10 otu_ids and map them in descending order 
    // so the otu_ids with the most bacteria are last.  

    // create an array of arrays with samples' sample_values indexed
    var all_sample_values_indexed = [];
    for (var index = 0; index < all_sample_values.length;index++){
      all_sample_values_indexed[index]=[all_sample_values[index], index];
    }

    // sort descending by sample values
    all_sample_values_indexed.sort((a,b)=> b[0]-a[0])

    // sort otu_labels & otu_ids by sample_values indexed's second index ie: the original index location
    var all_otu_labels_resort = [];
    var all_otu_ids_resort = [];
    if (all_otu_ids.length == all_sample_values_indexed.length && all_otu_labels.length == all_sample_values_indexed.length){
      for (var index = 0; index < all_sample_values_indexed.length; index++){
        all_otu_labels_resort[index] = all_otu_labels[all_sample_values_indexed[index][1]];
        all_otu_ids_resort[index]=all_otu_ids[all_sample_values_indexed[index][1]];
      }
    }

    var yticks = all_otu_ids_resort.slice(0,10).map(element=> `OTU ${element.toString()} `).reverse()
    var top_10_otu_labels = all_otu_labels_resort.slice(0,10).map(element => element).reverse()
    var top_10_sample_values = all_sample_values_indexed.slice(0,10).map(element=>element[0]).reverse()

    // Create the trace for the bar chart. 
    var barData = [{
      x: top_10_sample_values,
      y: yticks,
      text: top_10_otu_labels,
      type: "bar",
      orientation: "h"
    }];  
    // Create the layout for the bar chart. 
    var barLayout = {
      title: "Top 10 Bacteria Cultures Found",
      yaxis: {ticktext: top_10_otu_labels},
      bargap:0.3,
      paper_bgcolor: "snowwhite",
      plot_bgcolor: "lightblue"
    };

    // Use Plotly to plot the data with the layout. 
    Plotly.newPlot("bar", barData, barLayout, {responsive:true})
    
    // Create the trace for the bubble chart.
    var bubbleData = [{
      x: all_otu_ids,
      y: all_sample_values,
      mode: "markers",
      marker: {
        color: all_otu_ids,
        colorscale: 'Earth',
        size: all_sample_values
      },
      text: all_otu_labels,
      hovertemplate: `(%{x}, %{y})<br>%{text}<extra></extra>`,
    }];

    // Create the layout for the bubble chart.
    var bubbleLayout = {
      hovermode:'closest',
      title: "Bacteria Cultures Per Sample" ,
      xaxis: {title: "OTU ID"},
      margin: { t: 60, r: 40, l: 40, b: 70 },
      paper_bgcolor: "snowwhite",
      plot_bgcolor: "aqua"
    };

    // D2: 3. Use Plotly to plot the data with the layout.
    Plotly.newPlot("bubble", bubbleData, bubbleLayout, {responsive:true})
  
        // 4. Create the trace for the gauge chart.
        var gaugeData = [{
          domain: {x:[0,1], y:[0,1]},
          value: wash_frequency,
          title: {text: "Scrubs Per Week",font: {size:16}},
          type: "indicator",
          mode: "gauge+number",
          gauge: {
            axis: {range: [null, 14], tickwidth: 1, tickcolor: "black", tickmode:"linear", tick0: 0, dtick: 2},
            bar: {color: "black"},
            steps: [
              {range: [0,2], color: "crimson"},
              {range: [2,4], color: "orangered"},
              {range: [4,6], color: "orange"},
              {range: [6,8], color: "gold"},
              {range: [8,10], color: "yellow"},
              {range: [10,12], color: "yellowgreen"},
              {range: [12,14], color: "green"}
            ]
          }
        }];
        
        // 5. Create the layout for the gauge chart.
        var gaugeLayout = { 
          autosize: true,
          title: {
            text: "Belly Button Washing Frequency",
            font: {size:20}
          },
          margin: { t: 100, r: 50, l: 50, b: 20 },
          paper_bgcolor: "snowwhite"
        };
    
        // 6. Use Plotly to plot the gauge data and layout.
        Plotly.newPlot("gauge", gaugeData,gaugeLayout, {responsive:true})
        
      });
    }