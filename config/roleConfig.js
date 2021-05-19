module.exports = {
  permission: [
    {
      label: 'Users',
      enable: true,
      isParent: true,
      parentId: '',
      buttons: [
        {
          label: 'add',
          enable: true,
        },
        {
          label: 'edit',
          enable: true,
        },
        {
          label: 'delete',
          enable: true,
        },
        {
          label: 'visibility',
          enable: false,
        },
        {
          label: 'reset',
          enable: false,
        },
        {
          label: 'export',
          enable: true,
        },
        {
          label: 'query',
          enable: true,
        },
      ],
    },

    {
      label: 'Role',
      enable: true,
      isParent: true,
      parentId: '',
      buttons: [
        {
          label: 'add',
          enable: true,
        },
        {
          label: 'edit',
          enable: true,
        },
        {
          label: 'assign',
          enable: true,
        },

        {
          label: 'export',
          enable: true,
        },
        {
          label: 'query',
          enable: true,
        },
      ],
    },

    {
      label: 'Enquiry',
      enable: true,
      isParent: true,
      parentId: '',
      buttons: [
        {
          label: 'edit',
          enable: true,
        },

        {
          label: 'visibility',
          enable: false,
        },
        {
          label: 'export',
          enable: true,
        },
        {
          label: 'query',
          enable: true,
        },
      ],
    },

    {
      label: 'Dashboard',
      enable: true,
      isParent: true,
      parentId: '',
      buttons: [],
    },
  ],
};
