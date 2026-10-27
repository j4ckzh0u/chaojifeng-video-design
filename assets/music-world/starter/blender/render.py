"""Run in Blender: blender -b --python blender/render.py -- --frames 0:90.

Deterministic scene state, shared score and explicit render cost. Adapt geometry
to the theme. The .blend is not presented as a complete baked animation.
"""
import argparse
import json
import math
from pathlib import Path
import sys
import bpy

ROOT=Path(__file__).resolve().parents[1]
JOB=json.loads((ROOT/'public/job.json').read_text())
C=JOB['config']; EVENTS=JOB['score']['events']


def material(name,color,metal=0,rough=.5):
    m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
    m.node_tree.nodes.clear()
    bs=m.node_tree.nodes.new('ShaderNodeBsdfPrincipled')
    out=m.node_tree.nodes.new('ShaderNodeOutputMaterial')
    m.node_tree.links.new(bs.outputs['BSDF'],out.inputs['Surface'])
    bs.inputs['Base Color'].default_value=(*color,1)
    bs.inputs['Metallic'].default_value=metal;bs.inputs['Roughness'].default_value=rough
    return m


def smooth(t):
    t=max(0,min(1,t));return t*t*(3-2*t)


def seed(i):
    v=math.sin(i*127.1+C['seed']*311.7)*43758.5453;return v-math.floor(v)


def build():
    bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
    scene=bpy.context.scene;scene.render.engine='BLENDER_EEVEE'
    scene.eevee.taa_render_samples=8;scene.eevee.taa_samples=8
    scene.eevee.use_raytracing=False
    scene.render.threads_mode='FIXED';scene.render.threads=2
    scene.render.resolution_x=C['width'];scene.render.resolution_y=C['height'];scene.render.resolution_percentage=100
    scene.render.fps=C['fps'];scene.render.image_settings.file_format='PNG'
    scene.world.use_nodes=True
    ink=C['style']=='ink'
    nt=scene.world.node_tree;nt.nodes.clear()
    bg=nt.nodes.new('ShaderNodeBackground');out=nt.nodes.new('ShaderNodeOutputWorld')
    nt.links.new(bg.outputs[0],out.inputs['Surface'])
    bg.inputs[0].default_value=(*((.5,.53,.49) if ink else (.08,.14,.18)),1)
    ground=material('paper' if ink else 'water',(.61,.6,.52) if ink else (.03,.12,.16),.1,.8 if ink else .2)
    body=material('ink' if ink else 'glaze',(.06,.085,.08) if ink else (.5,.76,.8),.1,.9 if ink else .18)
    bpy.ops.mesh.primitive_plane_add(size=100);bpy.context.object.data.materials.append(ground)
    objs=[]
    for i in range(7):
        if ink:bpy.ops.mesh.primitive_cone_add(vertices=7,radius1=1.2,radius2=.05,depth=1)
        else:bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=12,radius=.8)
        o=bpy.context.object;o.name=f'subject-{i}';o.data.materials.append(body);objs.append(o)
    bpy.ops.object.light_add(type='AREA',location=(4,-5,10));bpy.context.object.data.energy=1800;bpy.context.object.data.shape='DISK';bpy.context.object.data.size=7
    bpy.ops.object.camera_add(location=(0,-14,8));scene.camera=bpy.context.object;scene.camera.data.lens=38
    return scene,objs


def update(scene,objects,frame):
    from mathutils import Vector
    t=frame/C['fps'];impact=max([e['strength']*math.exp(-(t-e['peak'])/.18) for e in EVENTS if e['peak']<=t<e['peak']+1]+[0])
    scene.camera.location=(math.sin(t*.18)*1.7,-14+.6*impact,8)
    scene.camera.rotation_euler=(Vector((0,0,1))-scene.camera.location).to_track_quat('-Z','Y').to_euler()
    for i,o in enumerate(objects):
        es=[e for e in EVENTS if e['object_id']==o.name and e['prepare']<=t]
        e=es[-1] if es else None
        g=smooth((t-e['trigger'])/max(.01,e['settle']-e['trigger'])) if e else smooth(t/2)
        h=(1+seed(i+20)*2)*(.1+.9*g)
        o.location=((i-3)*1.55,(seed(i)-.5)*3,h/2);o.scale=(1,1,h);o.rotation_euler.z=t*.12+seed(i+40)*3


if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--frames',help='half-open range, default full film')
    args=p.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
    total=round(C['duration']*C['fps']);a,b=map(int,args.frames.split(':')) if args.frames else (0,total)
    if not 0<=a<b<=total:raise ValueError('invalid frame range')
    dest=ROOT/'public/frames';dest.mkdir(parents=True,exist_ok=True)
    scene,objects=build()
    for frame in range(a,b):
        update(scene,objects,frame);scene.render.filepath=str(dest/f'{frame:05d}.png');bpy.ops.render.render(write_still=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'output-scene.blend'))
