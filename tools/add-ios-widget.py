#!/usr/bin/env python3
"""Adds the PortiaWidget extension (home screen and lock screen widgets) and the app's own Swift
files to ios/App/App.xcodeproj. Safe to run again: it does nothing when the target is already there.
Usage: python3 tools/add-ios-widget.py [path/to/project.pbxproj]"""
import re, sys

P = sys.argv[1] if len(sys.argv) > 1 else 'ios/App/App.xcodeproj/project.pbxproj'
s = open(P, encoding='utf-8').read()
if 'PortiaWidget.appex' in s:
    print('Widgetul e deja în proiect.'); sys.exit(0)

PROJECT = '504EC2FC1FED79650016851F'; APP = '504EC3031FED79650016851F'
MAIN_GROUP = '504EC2FB1FED79650016851F'; PRODUCTS = '504EC3051FED79650016851F'; APP_GROUP = '504EC3061FED79650016851F'
APP_SOURCES = '504EC3001FED79650016851F'; APP_DEBUG = '504EC3171FED79650016851F'; APP_RELEASE = '504EC3181FED79650016851F'
for k in [PROJECT, APP, MAIN_GROUP, PRODUCTS, APP_GROUP, APP_SOURCES, APP_DEBUG, APP_RELEASE]:
    assert k in s, 'Proiectul nu arată cum mă aștept: lipsește ' + k

n = [0]
def nid():
    n[0] += 1
    return 'B0B7A1D0%016X' % n[0]
ID = {k: nid() for k in ['F_VC', 'BF_VC', 'F_PL', 'BF_PL', 'F_AENT', 'G_W', 'F_WD', 'F_WV', 'F_WW', 'F_WI', 'F_WE', 'BF_WD', 'BF_WV', 'BF_WW',
                         'P_APPEX', 'BF_APPEX', 'EMBED', 'S_W', 'FR_W', 'R_W', 'T_W', 'C_WD', 'C_WR', 'CL_W', 'DEP', 'PROXY']}
I = ID

def section_add(name, text):
    """Append entries at the end of a section, creating the section when it is missing."""
    global s
    end = '/* End %s section */' % name
    if end in s:
        s = s.replace(end, text + end, 1)
        return
    order = ['PBXBuildFile', 'PBXContainerItemProxy', 'PBXCopyFilesBuildPhase', 'PBXFileReference', 'PBXFrameworksBuildPhase', 'PBXGroup',
             'PBXNativeTarget', 'PBXProject', 'PBXResourcesBuildPhase', 'PBXSourcesBuildPhase', 'PBXTargetDependency', 'PBXVariantGroup',
             'XCBuildConfiguration', 'XCConfigurationList']
    after = order[order.index(name) + 1:]
    for a in after:
        b = '/* Begin %s section */' % a
        if b in s:
            s = s.replace(b, '/* Begin %s section */\n%s/* End %s section */\n\n%s' % (name, text, name, b), 1)
            return
    raise SystemExit('Nu găsesc unde să pun secțiunea ' + name)

def obj_at(oid):
    """Where an object is defined (not merely mentioned in someone else's list)."""
    m = re.search(r'\n\t\t' + oid + r'(?: /\*[^\n]*?\*/)? = \{', s)
    assert m, 'Nu găsesc obiectul ' + oid
    return m.start()

def list_add(owner, key, item):
    """Add an item to a list property (children, files, buildPhases...) of one object."""
    global s
    i = obj_at(owner)
    j = s.index(key + ' = (', i)
    k = s.index(');', j)
    s = s[:k] + '\t' + item + ',\n\t\t\t' + s[k:]

def setting_add(config, line):
    global s
    i = obj_at(config)
    j = s.index('buildSettings = {', i) + len('buildSettings = {')
    s = s[:j] + '\n\t\t\t\t' + line + s[j:]

section_add('PBXBuildFile',
    '\t\t%(BF_VC)s /* PortiaViewController.swift in Sources */ = {isa = PBXBuildFile; fileRef = %(F_VC)s /* PortiaViewController.swift */; };\n'
    '\t\t%(BF_PL)s /* PortiaWidgetPlugin.swift in Sources */ = {isa = PBXBuildFile; fileRef = %(F_PL)s /* PortiaWidgetPlugin.swift */; };\n'
    '\t\t%(BF_WD)s /* WidgetData.swift in Sources */ = {isa = PBXBuildFile; fileRef = %(F_WD)s /* WidgetData.swift */; };\n'
    '\t\t%(BF_WV)s /* WidgetViews.swift in Sources */ = {isa = PBXBuildFile; fileRef = %(F_WV)s /* WidgetViews.swift */; };\n'
    '\t\t%(BF_WW)s /* PortiaWidget.swift in Sources */ = {isa = PBXBuildFile; fileRef = %(F_WW)s /* PortiaWidget.swift */; };\n'
    '\t\t%(BF_APPEX)s /* PortiaWidget.appex in Embed Foundation Extensions */ = {isa = PBXBuildFile; fileRef = %(P_APPEX)s /* PortiaWidget.appex */; settings = {ATTRIBUTES = (RemoveHeadersOnCopy, ); }; };\n' % I)
section_add('PBXContainerItemProxy',
    '\t\t%(PROXY)s /* PBXContainerItemProxy */ = {\n\t\t\tisa = PBXContainerItemProxy;\n\t\t\tcontainerPortal = ' % I + PROJECT + ' /* Project object */;\n\t\t\tproxyType = 1;\n\t\t\tremoteGlobalIDString = %(T_W)s;\n\t\t\tremoteInfo = PortiaWidget;\n\t\t};\n' % I)
section_add('PBXCopyFilesBuildPhase',
    '\t\t%(EMBED)s /* Embed Foundation Extensions */ = {\n\t\t\tisa = PBXCopyFilesBuildPhase;\n\t\t\tbuildActionMask = 2147483647;\n\t\t\tdstPath = "";\n\t\t\tdstSubfolderSpec = 13;\n\t\t\tfiles = (\n\t\t\t\t%(BF_APPEX)s /* PortiaWidget.appex in Embed Foundation Extensions */,\n\t\t\t);\n\t\t\tname = "Embed Foundation Extensions";\n\t\t\trunOnlyForDeploymentPostprocessing = 0;\n\t\t};\n' % I)
section_add('PBXFileReference',
    '\t\t%(F_VC)s /* PortiaViewController.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = PortiaViewController.swift; sourceTree = "<group>"; };\n'
    '\t\t%(F_PL)s /* PortiaWidgetPlugin.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = PortiaWidgetPlugin.swift; sourceTree = "<group>"; };\n'
    '\t\t%(F_AENT)s /* App.entitlements */ = {isa = PBXFileReference; lastKnownFileType = text.plist.entitlements; path = App.entitlements; sourceTree = "<group>"; };\n'
    '\t\t%(F_WD)s /* WidgetData.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = WidgetData.swift; sourceTree = "<group>"; };\n'
    '\t\t%(F_WV)s /* WidgetViews.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = WidgetViews.swift; sourceTree = "<group>"; };\n'
    '\t\t%(F_WW)s /* PortiaWidget.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = PortiaWidget.swift; sourceTree = "<group>"; };\n'
    '\t\t%(F_WI)s /* Info.plist */ = {isa = PBXFileReference; lastKnownFileType = text.plist.xml; path = Info.plist; sourceTree = "<group>"; };\n'
    '\t\t%(F_WE)s /* PortiaWidget.entitlements */ = {isa = PBXFileReference; lastKnownFileType = text.plist.entitlements; path = PortiaWidget.entitlements; sourceTree = "<group>"; };\n'
    '\t\t%(P_APPEX)s /* PortiaWidget.appex */ = {isa = PBXFileReference; explicitFileType = "wrapper.app-extension"; includeInIndex = 0; path = PortiaWidget.appex; sourceTree = BUILT_PRODUCTS_DIR; };\n' % I)
section_add('PBXFrameworksBuildPhase',
    '\t\t%(FR_W)s /* Frameworks */ = {\n\t\t\tisa = PBXFrameworksBuildPhase;\n\t\t\tbuildActionMask = 2147483647;\n\t\t\tfiles = (\n\t\t\t);\n\t\t\trunOnlyForDeploymentPostprocessing = 0;\n\t\t};\n' % I)
section_add('PBXGroup',
    '\t\t%(G_W)s /* PortiaWidget */ = {\n\t\t\tisa = PBXGroup;\n\t\t\tchildren = (\n\t\t\t\t%(F_WW)s /* PortiaWidget.swift */,\n\t\t\t\t%(F_WV)s /* WidgetViews.swift */,\n\t\t\t\t%(F_WD)s /* WidgetData.swift */,\n\t\t\t\t%(F_WI)s /* Info.plist */,\n\t\t\t\t%(F_WE)s /* PortiaWidget.entitlements */,\n\t\t\t);\n\t\t\tpath = PortiaWidget;\n\t\t\tsourceTree = "<group>";\n\t\t};\n' % I)
section_add('PBXNativeTarget',
    '\t\t%(T_W)s /* PortiaWidget */ = {\n\t\t\tisa = PBXNativeTarget;\n\t\t\tbuildConfigurationList = %(CL_W)s /* Build configuration list for PBXNativeTarget "PortiaWidget" */;\n\t\t\tbuildPhases = (\n\t\t\t\t%(S_W)s /* Sources */,\n\t\t\t\t%(FR_W)s /* Frameworks */,\n\t\t\t\t%(R_W)s /* Resources */,\n\t\t\t);\n\t\t\tbuildRules = (\n\t\t\t);\n\t\t\tdependencies = (\n\t\t\t);\n\t\t\tname = PortiaWidget;\n\t\t\tproductName = PortiaWidget;\n\t\t\tproductReference = %(P_APPEX)s /* PortiaWidget.appex */;\n\t\t\tproductType = "com.apple.product-type.app-extension";\n\t\t};\n' % I)
section_add('PBXResourcesBuildPhase',
    '\t\t%(R_W)s /* Resources */ = {\n\t\t\tisa = PBXResourcesBuildPhase;\n\t\t\tbuildActionMask = 2147483647;\n\t\t\tfiles = (\n\t\t\t);\n\t\t\trunOnlyForDeploymentPostprocessing = 0;\n\t\t};\n' % I)
section_add('PBXSourcesBuildPhase',
    '\t\t%(S_W)s /* Sources */ = {\n\t\t\tisa = PBXSourcesBuildPhase;\n\t\t\tbuildActionMask = 2147483647;\n\t\t\tfiles = (\n\t\t\t\t%(BF_WW)s /* PortiaWidget.swift in Sources */,\n\t\t\t\t%(BF_WV)s /* WidgetViews.swift in Sources */,\n\t\t\t\t%(BF_WD)s /* WidgetData.swift in Sources */,\n\t\t\t);\n\t\t\trunOnlyForDeploymentPostprocessing = 0;\n\t\t};\n' % I)
section_add('PBXTargetDependency',
    '\t\t%(DEP)s /* PBXTargetDependency */ = {\n\t\t\tisa = PBXTargetDependency;\n\t\t\ttarget = %(T_W)s /* PortiaWidget */;\n\t\t\ttargetProxy = %(PROXY)s /* PBXContainerItemProxy */;\n\t\t};\n' % I)
WS = lambda debug: (
    '\t\t\t\tCODE_SIGN_ENTITLEMENTS = PortiaWidget/PortiaWidget.entitlements;\n'
    '\t\t\t\tCODE_SIGN_STYLE = Automatic;\n'
    '\t\t\t\tCURRENT_PROJECT_VERSION = 1;\n'
    '\t\t\t\tGENERATE_INFOPLIST_FILE = NO;\n'
    '\t\t\t\tINFOPLIST_FILE = PortiaWidget/Info.plist;\n'
    '\t\t\t\tIPHONEOS_DEPLOYMENT_TARGET = 17.0;\n'
    '\t\t\t\tLD_RUNPATH_SEARCH_PATHS = (\n\t\t\t\t\t"$(inherited)",\n\t\t\t\t\t"@executable_path/Frameworks",\n\t\t\t\t\t"@executable_path/../../Frameworks",\n\t\t\t\t);\n'
    '\t\t\t\tMARKETING_VERSION = 1.0.0;\n'
    '\t\t\t\tPRODUCT_BUNDLE_IDENTIFIER = com.portia.app.widget;\n'
    '\t\t\t\tPRODUCT_NAME = "$(TARGET_NAME)";\n'
    '\t\t\t\tSKIP_INSTALL = YES;\n'
    '\t\t\t\tSWIFT_ACTIVE_COMPILATION_CONDITIONS = ' + ('DEBUG' if debug else '""') + ';\n'
    '\t\t\t\tSWIFT_VERSION = 5.0;\n'
    '\t\t\t\tTARGETED_DEVICE_FAMILY = "1,2";\n')
section_add('XCBuildConfiguration',
    '\t\t%(C_WD)s /* Debug */ = {\n\t\t\tisa = XCBuildConfiguration;\n\t\t\tbuildSettings = {\n' % I + WS(True) + '\t\t\t};\n\t\t\tname = Debug;\n\t\t};\n'
    '\t\t%(C_WR)s /* Release */ = {\n\t\t\tisa = XCBuildConfiguration;\n\t\t\tbuildSettings = {\n' % I + WS(False) + '\t\t\t};\n\t\t\tname = Release;\n\t\t};\n')
section_add('XCConfigurationList',
    '\t\t%(CL_W)s /* Build configuration list for PBXNativeTarget "PortiaWidget" */ = {\n\t\t\tisa = XCConfigurationList;\n\t\t\tbuildConfigurations = (\n\t\t\t\t%(C_WD)s /* Debug */,\n\t\t\t\t%(C_WR)s /* Release */,\n\t\t\t);\n\t\t\tdefaultConfigurationIsVisible = 0;\n\t\t\tdefaultConfigurationName = Release;\n\t\t};\n' % I)

# wire it into what is already there
list_add(MAIN_GROUP, 'children', '%(G_W)s /* PortiaWidget */' % I)
list_add(PRODUCTS, 'children', '%(P_APPEX)s /* PortiaWidget.appex */' % I)
list_add(APP_GROUP, 'children', '%(F_VC)s /* PortiaViewController.swift */' % I)
list_add(APP_GROUP, 'children', '%(F_PL)s /* PortiaWidgetPlugin.swift */' % I)
list_add(APP_GROUP, 'children', '%(F_AENT)s /* App.entitlements */' % I)
list_add(APP_SOURCES, 'files', '%(BF_VC)s /* PortiaViewController.swift in Sources */' % I)
list_add(APP_SOURCES, 'files', '%(BF_PL)s /* PortiaWidgetPlugin.swift in Sources */' % I)
list_add(APP, 'buildPhases', '%(EMBED)s /* Embed Foundation Extensions */' % I)
list_add(APP, 'dependencies', '%(DEP)s /* PBXTargetDependency */' % I)
list_add(PROJECT, 'targets', '%(T_W)s /* PortiaWidget */' % I)
setting_add(APP_DEBUG, 'CODE_SIGN_ENTITLEMENTS = App/App.entitlements;')
setting_add(APP_RELEASE, 'CODE_SIGN_ENTITLEMENTS = App/App.entitlements;')
i = s.index('TargetAttributes = {') + len('TargetAttributes = {')
s = s[:i] + '\n\t\t\t\t\t%(T_W)s = {\n\t\t\t\t\t\tCreatedOnToolsVersion = 16.0;\n\t\t\t\t\t};' % I + s[i:]

assert s.count('{') == s.count('}') and s.count('(') == s.count(')'), 'Paranteze dezechilibrate'
open(P, 'w', encoding='utf-8').write(s)
print('Am adăugat widgetul în proiect.')
