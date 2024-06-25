function parseXML(jQuery, text) {
    const $ = jQuery;
    const path = '/Medal.xml';

    $("#main").html('');

    $.ajax({
        type: "GET",
        url: path,
        async: false,
        dataType: "xml",
        success: data => {
            // const xml = $($.parseXML(data));
            const $xml = $(data);
            console.log($xml);

            $xml.find("imgdir[name='medal'] imgdir")
                .sort((a, b) => {
                    return Number($(a).attr("name")) - Number($(b).attr("name"));
                })
                .each((index, element) => {
                    const id = Number($(element).attr("name"));

                    const [w, c, e] = ["w", "c", "e"].map(name => {
                        const $canvas = $(element).find(`canvas[name='${name}']`);

                        const originX = Number($canvas.find("vector").attr("x"));
                        const originY = Number($canvas.find("vector").attr("y"));

                        const $inlink = $canvas.find("string[name='_inlink']");
                        if ($inlink.length > 0) {
                            const [_, number, pos] = $inlink.attr("value").split("/");

                            return {
                                originX,
                                originY,
                                basedata: $(element).parent().find(`imgdir[name='${number}'] canvas[name='${pos}']`).attr("basedata")
                            }
                        }

                        return {
                            originX,
                            originY,
                            basedata: $(element).find(`canvas[name='${name}']`).attr("basedata")
                        }
                    });

                    const color = Number($(element).find("int[name='clr']").attr("value"));

                    const canvas = $("#nameTag").get(0);
                    const ctx = canvas.getContext('2d');

                    const font = '12.5px "Arial", serif';
                    const padding = 5;
                    ctx.font = font;
                    const textWidth = ctx.measureText(text).width + padding * 2;
                    // You need to adjust the canvas size based on your requirement

                    // Load images and draw on canvas
                    const loadImage = (base64, originX, originY) => {
                        return new Promise((resolve, reject) => {
                            const img = new Image();
                            img.onload = () => resolve({ img, originX, originY });
                            img.onerror = reject;
                            img.src = `data:image/png;base64,${base64}`;
                        });
                    };

                    Promise.all([
                        loadImage(w.basedata, w.originX, w.originY),
                        loadImage(c.basedata, c.originX, c.originY),
                        loadImage(e.basedata, e.originX, e.originY)
                    ]).then(([w, c, e]) => {
                        const repeatC = Math.ceil(textWidth / c.img.width);

                        // Calculate the total width of the nametag
                        const totalNameTagWidth = w.img.width + (c.img.width * repeatC) + e.img.width;

                        // Adjust canvas size
                        canvas.width = totalNameTagWidth;
                        canvas.height = Math.max(w.img.height, c.img.height, e.img.height);

                        // Draw the left, center, and right sections
                        let x = 0;
                        ctx.drawImage(w.img, x, 0);
                        x += w.img.width;
                        for (let i = 0; i < repeatC; i++) {
                            // ctx.drawImage(c.img, x, 0);
                            ctx.drawImage(c.img, x, w.img.height - c.img.height);
                            // ctx.drawImage(c.img, x, c.originY);
                            x += c.img.width;
                        }
                        // ctx.drawImage(e.img, x, 0);
                        ctx.drawImage(e.img, x, w.img.height - e.img.height)
                        // ctx.drawImage(e.img, x, e.originY)

                        // Center the text within the nametag
                        const textX = (totalNameTagWidth - textWidth) / 2 + padding;
                        const textY = (canvas.height / 2) + 4; // Adjust for vertical center
                        ctx.font = font;
                        ctx.fillStyle = convertRawColorToRgba(color);
                        ctx.fillText(text, textX, textY);

                        // Set the image as the content of the div
                        $("#main").append(`
                          <tr>
                            <td>${id}</td>
                            <td>
                              <img src="${canvas.toDataURL()}"></img>
                            </td>
                            <td>(${w.img.width}, ${w.img.height})</td>
                            <td>(${c.img.width}, ${c.img.height})</td>
                            <td>(${e.img.width}, ${e.img.height})</td>
                          </tr>
                        `);
                    });
                });
        }
    });

    function convertRawColorToRgba(rawColor) {
        // Convert the raw color to a 32-bit unsigned integer
        const color = rawColor >>> 0;

        // Extract RGBA components
        const alpha = (color >> 24) & 0xFF;
        const red = (color >> 16) & 0xFF;
        const green = (color >> 8) & 0xFF;
        const blue = color & 0xFF;

        // Convert alpha to a range between 0 and 1
        const alphaNormalized = alpha / 255;

        // Construct the RGBA string
        return `rgba(${red}, ${green}, ${blue}, ${alphaNormalized})`;
    }
}

$(function () {
    if (!window.location.search.includes('medalText')) {
        return;
    }

    const searchText = new URLSearchParams(window.location.search).get('medalText')

    $("#medalText").val(searchText);
    $("#header").show();

    parseXML($, searchText);
});