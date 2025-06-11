(function ($, PLUGIN_ID) {
  kintone.events.on("app.record.index.show", (events) => {
    let CONFIG = kintone.plugin.app.getConfig(PLUGIN_ID);
    if (!CONFIG) return;
    let CONFIG_JSON = JSON.parse(CONFIG.config || "{}");
    let BUTTONNAME = CONFIG_JSON.table
      .filter((item) => item.buttonName && item.buttonName.trim() !== "")
      .map((item) => item.buttonName);
    let records = events.records;
    console.log("records", records)
    const spaceEl = kintone.app.getHeaderSpaceElement();
    if (!spaceEl)
      throw new Error("The header element is unavailable on this page.");

    if ($(spaceEl).find(".custom-space-el").length > 0) {
      return;
    }

    const div = $("<div>").addClass("custom-space-el").css({
      margin: "10px 0",
      display: "flex",
      alignItems: "center",
      gap: "10px",
    });

    let savedValues = {};
    try {
      savedValues =
        JSON.parse(localStorage.getItem("myPluginInputValues")) || {};
    } catch (e) {
      savedValues = {};
    }

    $.each(CONFIG_JSON.table || [], function (index, item) {
      let labelName = item?.InputName;
      const wrapper = $("<div>").css({ margin: "10px 0" });
      const label = $("<label>")
        .attr("for", `dynamic-input-${index}`)
        .text(labelName + ":")
        .css({ marginRight: "10px" });
      wrapper.append(label);
      let input;

      switch (item.fieldA) {
        case "Date":
          input = $('<input type="date">');
          break;
        case "Text":
          input = $('<input type="text">');
          break;
        case "Number":
          input = $('<input type="number">');
          break;
        case "Drop_down": {
          input = $("<select>")
            .addClass("type-select-field-A kintoneplugin-input-text")
            .attr("id", `dynamic-input-${index}`)
            .attr("name", `dynamic-input-${index}`)
            .css({ padding: "5px", marginLeft: "5px" })
            .append('<option value="-----">-----</option>')
            .append('<option value="sample1">sample1</option>')
            .append('<option value="sample2">sample2</option>')
            .append('<option value="sample3">sample3</option>');
          break;
        }
        default:
          input = $('<input type="text">');
      }

      if (item.fieldA !== "Drop_down") {
        input
          .attr("id", `dynamic-input-${index}`)
          .attr("name", `dynamic-input-${index}`)
          .css({ padding: "5px", marginLeft: "5px" })
          .addClass("kintoneplugin-input-text");
      } else {
        input
          .attr("id", `dynamic-input-${index}`)
          .attr("name", `dynamic-input-${index}`)
          .css({ padding: "5px", marginLeft: "5px" });
      }

      // Set input value from savedValues if present
      if (savedValues.hasOwnProperty(`dynamic-input-${index}`)) {
        input.val(savedValues[`dynamic-input-${index}`]);
      }
      wrapper.append(input);
      div.append(wrapper);
    });
    let button = $("<button>")
      .addClass("kintoneplugin-button-dialog-ok")
      .text(`${BUTTONNAME}`);
    console.log("item?.buttonName", BUTTONNAME);
    div.append(button);
    $(spaceEl).append(div);

    // Search button click handler
    let valuesToSave = {};
    button.on("click", async function () {
      $.each(CONFIG_JSON.table || [], function (index, item) {
        const val = $(`#dynamic-input-${index}`).val();
        valuesToSave[`dynamic-input-${index}`] = val;
      });
      localStorage.setItem("myPluginInputValues", JSON.stringify(valuesToSave));
      let queryParts = [];

      // Loop inputs to build query parts
      $.each(CONFIG_JSON.table || [], function (index, item) {
        const value = $(`#dynamic-input-${index}`).val();
        console.log("item", item);
        console.log("value", value);

        if (value && value !== "" && value !== "-----") {
          const fieldCode = item.fieldA;
          if (!fieldCode) {
            console.warn(`Missing fieldCode for item at index ${index}`);
            return;
          }
          console.log(fieldCode);
          switch (item.fieldA) {
            case "Text":
              queryParts.push(`(${fieldCode} like "${value}")`);
              break;
            case "Drop_down":
              queryParts.push(`(${fieldCode} in ("${value}"))`);
              break;
            case "Number":
              queryParts.push(`(${fieldCode} = ${value})`);
              break;
            case "Date":
              queryParts.push(
                `(${fieldCode} >= "${value}") and (${fieldCode} <= "${value}")`
              );
              break;
            default:
              console.warn(`Unhandled field type: ${item.fieldA}`);
              break;
          }
        }
      });

      console.log("queryParts", queryParts);
      // Combine with AND
      const query = queryParts.join(" and ");

      console.log("query", query);

      if (!query) {
        alert("Please enter at least one search condition.");
        return;
      }
      const baseUrl = window.location.href.match(/\S+\//)[0];
      const encodedQuery = encodeURIComponent(query);
      const url = baseUrl + "?query=" + encodedQuery;

      window.location.href = url;
    });
    return events;
  });
})(jQuery, kintone.$PLUGIN_ID);
