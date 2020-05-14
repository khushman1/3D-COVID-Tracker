from PIL import Image, ImageDraw, ImageFont
import json
from os import walk

image_size = (256, 256)
back_color = (200, 200, 200, 0)
x, y = 16, 80
text_color = (255, 255, 255)
shadow_color = (0, 0, 0)
font_size = 40
border_size = 3

files = []
for _, _, filenames in walk('./images/labels/'):
    files.extend(filenames)
files = [".".join(i.split(".")[:-1]) for i in files]
done_set = set(files)

def generateSubTreeImages(data):
    if data["name"] not in done_set:
        done_set.add(data["name"])
        img = Image.new('RGBA', image_size, color = back_color)
        fnt = ImageFont.truetype('/home/kman/.fonts/Roboto-Medium.ttf', font_size)
        d = ImageDraw.Draw(img)
        text = "\n".join(data["name"].split())
        d.text((x - border_size, y - border_size), text, font = fnt, fill = shadow_color)
        d.text((x + border_size, y - border_size), text, font = fnt, fill = shadow_color)
        d.text((x - border_size, y + border_size), text, font = fnt, fill = shadow_color)
        d.text((x + border_size, y + border_size), text, font = fnt, fill = shadow_color)
        d.text((x, y), text, font = fnt, fill = text_color)
        img.save(f'./images/labels/{data["name"]}.png', 'PNG')
        print(f'Saved {data["name"]}.png')
    if data["children"]:
        for children in data["children"].values():
            generateSubTreeImages(children)


with open('parsed_data_timeseries.json', 'r') as f:
    data = json.loads(f.read())

generateSubTreeImages(data)
